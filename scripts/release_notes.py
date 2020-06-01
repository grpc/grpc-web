# Copyright 2020 gRPC authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Generate release notes in Markdown from Github PRs.

You'll need a github API token to avoid being rate-limited. See
https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/

1. Create a draft release notes / changelog, by running:

$ python3 scripts/release_notes.py --token=<token> --output_unreleased \
  --output_without_labels

2. Adjust each PR, if necessary, after reading the draft:

2a. Apply one of these labels, if you want the PR to be included in the
release notes / changelog:

- release notes: breaking     for breaking changes
- release notes: major        for major features
- release notes: yes          for other fixes and changes

2b. Fix any PR title, to better reflect the changes done.

2c. Add "author:@<github username>" to the PR body to attribute the code to
the original author if this is an import/export.

3. Finalize the release notes, by running:

$ python3 scripts/release_notes.py --token=<token> > CHANGELOG.md

4. Check in the changes.

"""

from collections import defaultdict
import urllib
from urllib.request import Request, urlopen, HTTPError
from enum import Enum
import json
import re
import subprocess

API_BASE_URL = "https://api.github.com/repos/grpc/grpc-web"
GRPC_WEB_TEAM = [
    "stanley-cheung",
    "fengli79",
    "vnorigoog",
    "wenbozhu",
    "jtattermusch",
    "srini100",
    "hsaliak",
]
UNRELEASED = 'Unreleased'

class LabelLevel(Enum):
    NO_LABEL = 0
    WITH_LABEL = 1       # release notes: yes
    MAJOR_FEATURE = 2    # release notes: major
    BREAKING_CHANGE = 3  # release notes: breaking
    def __gt__(self, other):
        if self.__class__ is other.__class__:
            return self.value > other.value
        return NotImplemented
    def __lt__(self, other):
        if self.__class__ is other.__class__:
            return self.value < other.value
        return NotImplemented

# Represent the changelog of one release
class ReleaseNotes:
    def __init__(self):
        self.without_labels = []
        self.with_labels = []
        self.major_features = []
        self.breaking_changes = []

# Main operations
class ProcessChangelog:
    def __init__(self):
        self.token = ""
        self.releases = []
        self.merged_prs = []
        self.changelog_by_release = defaultdict(ReleaseNotes)

    # Make a Github API call
    def github_api(self, url):
        if not url.startswith('http'):
            url = API_BASE_URL + url
        req = Request(url)
        req.add_header('Authorization', 'token {}'.format(self.token))
        f = urlopen(req)
        response = json.loads(f.read().decode('utf-8'))
        return response, f.info()

    # Find out which release a PR belongs to
    def check_release(self, sha):
        for release in self.releases:
            retcode = subprocess.call([
                "git", "merge-base", "--is-ancestor", sha, release['sha']
            ])
            if retcode == 0:
                return release['release']
        return UNRELEASED

    # A helper function to check through all the "release notes: xxx"
    # labels of a PR and return the highest level
    def _get_pr_label_level(self, labels):
        label_level = LabelLevel.NO_LABEL
        for label in labels:
            _label_level = LabelLevel.NO_LABEL
            if label['name'] == "release notes: yes":
                _label_level = LabelLevel.WITH_LABEL
            elif label['name'] == "release notes: major":
                _label_level = LabelLevel.MAJOR_FEATURE
            elif label['name'] == "release notes: breaking":
                _label_level = LabelLevel.BREAKING
            if _label_level > label_level: # retain the highest level
                label_level = _label_level
        return label_level

    # Retrieve the list of all the releases
    def get_releases(self):
        # Might get into trouble if we ever have more than 30 releases
        github_releases, _ = self.github_api('/releases')
        for release in github_releases:
            ref_data, _ = self.github_api(
                '/git/ref/tags/' + release['tag_name'])
            tag_data, _ = self.github_api(
                '/git/commits/' + ref_data['object']['sha'])
            self.releases.append({
                'release': release['tag_name'],
                'date': tag_data['author']['date'],
                'sha': ref_data['object']['sha'][0:7]
            })
        self.releases.sort(key=lambda val:val['date'])

    # Retrieve the list of all merged PRs
    def get_merged_prs(self, num_pages):
        url = '/pulls?state=closed'
        while True:
            response, headers = self.github_api(url)
            for pr in response:
                if pr['number'] == 1: # had trouble with git merge-base
                    continue
                if pr['merged_at'] is None: # not merged
                    continue
                label_level = self._get_pr_label_level(pr['labels'])
                m = re.search(r'author: ?@([A-Za-z\d-]+)', pr['body'])
                if m:
                    author = m[1] # author attribution override
                else:
                    author = pr['user']['login']
                sha = pr['merge_commit_sha'][0:7]
                release = self.check_release(sha)
                self.merged_prs.append({
                    'number': str(pr['number']),
                    'author': author,
                    'title': pr['title'],
                    'release': release,
                    'label_level': label_level,
                })

            num_pages -= 1
            if num_pages == 0:
                break

            link = headers.get('link')
            if re.search(r'; rel="next"', link):
                # next page
                url = re.sub(r'.*<(.*)>; rel="next".*', r'\1', link)
            else:
                break

    # Format each PR into one line of release notes, and classify them
    # by release and label level
    def format_release_notes(self):
        for pr in self.merged_prs:
            release = pr['release']
            author = pr['author']
            num = '[#{}](https://github.com/grpc/grpc-web/pull/{})'.format(
                pr['number'], pr['number'])
            if len(pr['title']) > 70:
                title = pr['title'][0:70] + "..."
            else:
                title = pr['title']
            if author not in GRPC_WEB_TEAM:
                credit = " [@{}](https://github.com/{})".format(author, author)
            else:
                credit = ""

            final_formatted_line = "- {} {}{}".format(num, title, credit)

            release_notes = self.changelog_by_release[release]
            if pr['label_level'] == LabelLevel.BREAKING_CHANGE:
                release_notes.breaking_changes.append(final_formatted_line)
            elif pr['label_level'] == LabelLevel.MAJOR_FEATURE:
                release_notes.major_features.append(final_formatted_line)
            elif pr['label_level'] == LabelLevel.WITH_LABEL:
                release_notes.with_labels.append(final_formatted_line)
            else:
                release_notes.without_labels.append(final_formatted_line)

    # Print the final result in the form of CHANGELOG.md
    def print_changelog(self, output_without_labels, output_unreleased):
        print("[//]: # (GENERATED FILE -- DO NOT EDIT!)")
        print("[//]: # (See scripts/release_notes.py for more details.)")
        for release, release_notes in self.changelog_by_release.items():
            if release == UNRELEASED and output_unreleased == False:
                continue
            print_other_changes_heading = False
            print("")
            print("## {}".format(release))
            if release_notes.breaking_changes:
                print_other_changes_heading = True
                print("")
                print("### Breaking Changes")
                print("")
                for line in release_notes.breaking_changes:
                    print(line)
            if release_notes.major_features:
                print_other_changes_heading = True
                print("")
                print("### Major Features")
                print("")
                for line in release_notes.major_features:
                    print(line)
            if release_notes.with_labels:
                print("")
                if print_other_changes_heading:
                    print("### Other Changes")
                    print("")
                for line in release_notes.with_labels:
                    print(line)
            if release_notes.without_labels and output_without_labels:
                print("")
                print("### Without Labels")
                print("")
                for line in release_notes.without_labels:
                    print(line)
            print("")

def build_args_parser():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--token',
                        type=str,
                        default='',
                        help='Github API token')
    parser.add_argument('--num_pages',
                        type=int,
                        default=20,
                        help='Number of pages to go back')
    parser.add_argument('--output_without_labels',
                        default=False,
                        action='store_true',
                        help='Whether to output PRs without labels')
    parser.add_argument('--output_unreleased',
                        default=False,
                        action='store_true',
                        help='Whether to output unreleased')
    return parser

def main():
    parser = build_args_parser()
    args = parser.parse_args()
    token, num_pages = args.token, args.num_pages
    output_unreleased = args.output_unreleased
    output_without_labels = args.output_without_labels
    if token == "":
        print("Error: Github API token is required --token=<token>")
        return

    worker = ProcessChangelog()
    worker.token = token

    # Retrieve the list of all the releases
    worker.get_releases()

    # Retrieve the list of all merged PRs
    worker.get_merged_prs(num_pages)

    # Format each PR into one line of release notes, and classify them
    # by release and label level
    worker.format_release_notes()

    # Print the final result in the form of CHANGELOG.md
    worker.print_changelog(output_without_labels, output_unreleased)

if __name__ == "__main__":
    main()
