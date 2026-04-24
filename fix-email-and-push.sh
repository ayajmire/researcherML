#!/bin/bash

echo "🔧 Fixing GitHub email privacy issue..."
echo ""

# Set git email to GitHub no-reply address
git config user.email "ayajmire@users.noreply.github.com"

echo "✅ Updated git email to: ayajmire@users.noreply.github.com"
echo ""

# Amend the last commit with new email
echo "📝 Updating commit author..."
git commit --amend --no-edit --reset-author

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main --force-with-lease

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Create a release tag:"
    echo "   git tag v1.0.0"
    echo "   git push origin v1.0.0"
    echo ""
    echo "2. Watch build at:"
    echo "   https://github.com/ayajmire/researcherML/actions"
    echo ""
else
    echo ""
    echo "❌ Push still failed."
    echo ""
    echo "Alternative: Disable email privacy on GitHub:"
    echo "1. Visit: https://github.com/settings/emails"
    echo "2. Uncheck: 'Keep my email addresses private'"
    echo "3. Run: git push origin main"
fi
