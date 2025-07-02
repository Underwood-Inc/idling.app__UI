#!/usr/bin/env python3
"""
Update PR description with documentation coverage badges
"""

import argparse
import os
import re
import sys
import requests


def update_pr_description(pr_number, repo, token):
    """Update PR description with documentation coverage status"""
    
    # Get environment variables
    badge_url = os.environ.get('DOC_BADGE_URL', '')
    overall_coverage = os.environ.get('OVERALL_COVERAGE', '0')
    doc_coverage = os.environ.get('DOC_COVERAGE', '0')
    docstring_coverage = os.environ.get('DOCSTRING_COVERAGE', '0')
    docs_passed = os.environ.get('DOCS_PASSED', 'false') == 'true'
    interrogate_passed = os.environ.get('INTERROGATE_PASSED', 'false') == 'true'
    
    if not badge_url:
        print("❌ Missing DOC_BADGE_URL environment variable")
        return False
    
    # GitHub API headers
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Documentation-Coverage-Bot'
    }
    
    # Get current PR
    api_url = f'https://api.github.com/repos/{repo}/pulls/{pr_number}'
    print(f"🔍 Fetching PR from: {api_url}")
    print(f"🔑 Using token: {'*' * (len(token) - 4) + token[-4:] if len(token) > 4 else '***'}")
    
    response = requests.get(api_url, headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch PR: {response.status_code}")
        print(f"📋 Response headers: {dict(response.headers)}")
        print(f"📋 Response body: {response.text}")
        
        # Check if it's a permissions issue
        if response.status_code == 403:
            print("🔍 403 Forbidden - This is likely a token permissions issue")
            print("💡 Make sure your WORKFLOW_TOKEN has these scopes:")
            print("   - repo (or public_repo for public repos)")
            print("   - pull_requests: read")
            print("   - pull_requests: write")
        elif response.status_code == 404:
            print("🔍 404 Not Found - Check if PR number and repo are correct")
        elif response.status_code == 401:
            print("🔍 401 Unauthorized - Token is invalid or expired")
            
        return False
    
    pr_data = response.json()
    current_description = pr_data.get('body', '') or ''
    
    # Create status indicators
    overall_status = '✅' if int(overall_coverage) >= 75 else '❌'
    docs_status = '✅' if docs_passed else '❌'
    docstring_status = '✅' if interrogate_passed else '❌'
    
    # Create documentation status section
    doc_section = f"""## 📚 Documentation Coverage Status

![Documentation Coverage]({badge_url})

*Updated automatically by Documentation Coverage workflow*

---

"""
    
    # Remove existing documentation section if present
    new_description = re.sub(
        r'## 📚 Documentation Coverage Status.*?---\n\n',
        '',
        current_description,
        flags=re.DOTALL
    )
    
    # Add new documentation section at the top
    new_description = doc_section + new_description.strip()
    
    # Update PR description
    update_data = {'body': new_description}
    print(f"🔄 Updating PR description...")
    response = requests.patch(api_url, json=update_data, headers=headers)
    
    if response.status_code == 200:
        print("✅ Updated PR description with documentation coverage badge")
        return True
    else:
        print(f"❌ Failed to update PR description: {response.status_code}")
        print(f"📋 Response headers: {dict(response.headers)}")
        print(f"📋 Response body: {response.text}")
        
        if response.status_code == 403:
            print("🔍 403 Forbidden - Token lacks pull_requests: write permission")
        elif response.status_code == 422:
            print("🔍 422 Unprocessable Entity - Invalid request data")
            
        return False


def main():
    parser = argparse.ArgumentParser(description='Update PR description with documentation coverage')
    parser.add_argument('--pr-number', required=True, help='Pull request number')
    parser.add_argument('--repo', required=True, help='Repository in owner/repo format')
    parser.add_argument('--token', required=True, help='GitHub token')
    
    args = parser.parse_args()
    
    success = update_pr_description(args.pr_number, args.repo, args.token)
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main() 