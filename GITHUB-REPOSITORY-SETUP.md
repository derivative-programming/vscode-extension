# Making Your GitHub Repository Public with Protected Main Branch

## 🔓 Step 1: Make Repository Public

1. **Navigate to Your Repository**
   - Go to https://github.com/derivative-programming/vscode-extension

2. **Change Visibility Settings**
   - Click on **Settings** tab (far right in the repository menu)
   - Scroll down to the **"Danger Zone"** section at the bottom
   - Click **"Change repository visibility"**
   - Select **"Make public"**
   - Type your repository name to confirm
   - Click **"I understand, change repository visibility"**

## 🛡️ Step 2: Configure Repository Rules and Branch Protection

### **Option A: Disable Repository Rules (Recommended for Direct Push)**

1. **Check Repository Rules First**
   - In your repository, click **Settings** → **Rules** (left sidebar)
   - Look for any rules affecting the `main` branch
   - **Delete or disable any repository rules** that require pull requests

2. **If you see repository rules:**
   - Click on the rule name
   - Click **"Delete rule"** or disable it
   - This overrides branch protection and prevents direct pushes

### **Option B: Set Up Branch Protection Only**

1. **Go to Branch Protection Settings**
   - In your repository, click **Settings** → **Branches** (left sidebar)
   - Click **"Add rule"** or **"Add branch protection rule"**

2. **Configure Protection Rule**
   ```
   Branch name pattern: main
   
   ❌ Require a pull request before merging: UNCHECKED (to allow direct push)
   ✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   ✅ Require conversation resolution before merging
   ✅ Allow force pushes: Specify who can force push → "Repository administrators"
   ❌ Allow deletions: NO
   ❌ Include administrators: UNCHECKED (allows you to bypass restrictions)
   ```

3. **Important**: The key is **NOT** requiring pull requests if you want direct push access
4. **Click "Create" to save the protection rule**

## 📁 Step 3: Create CODEOWNERS File (via GitHub Website)

## 📁 Step 3: Create CODEOWNERS File (via GitHub Website)

1. **Navigate to Your Repository Root**
   - Go to your repository main page
   - Click **"Create new file"** button

2. **Create the CODEOWNERS File**
   - In the file name field, type: `.github/CODEOWNERS`
   - GitHub will automatically create the `.github` folder
   
3. **Add CODEOWNERS Content**
   ```
   # Global code ownership - only vroche can approve changes
   * @vroche

   # Specific protections for critical files
   package.json @vroche
   README.md @vroche
   src/ @vroche
   ```
   
4. **Commit the File**
   - Add commit message: "Add CODEOWNERS file for branch protection"
   - Click **"Commit new file"**

**Note:** This ensures only vroche can approve and merge changes to main!

## 🔧 Step 4: Additional Security Settings

### **Repository Settings to Consider:**
- **"Allow merge commits"**: ✅ Enabled
- **"Allow squash merging"**: ✅ Enabled  
- **"Allow rebase merging"**: ✅ Enabled
- **"Always suggest updating pull request branches"**: ✅ Enabled
- **"Allow auto-merge"**: ❌ Disabled (for more control)
- **"Automatically delete head branches"**: ✅ Enabled (cleanup)

## 🤝 Step 5: Contributor Workflow

With these settings, contributors will need to:

1. **Fork your repository**
2. **Create feature branch** in their fork
3. **Submit Pull Request** to your main branch
4. **Wait for vroche's approval** before merging
5. **vroche reviews and merges** when ready

## ⚡ Summary: All Steps via GitHub Website

### **Complete Website-Only Workflow:**

1. **Make Repository Public**
   - Settings → Danger Zone → Change repository visibility → Make public

2. **Protect Main Branch**
   - Settings → Branches → Add rule → Configure protection settings

3. **Create CODEOWNERS File**
   - Repository root → Create new file → `.github/CODEOWNERS` → Add content → Commit

4. **Configure Additional Settings**
   - Settings → General → Scroll to merge options and configure as needed

All done through the GitHub website interface! 🎉

## 🎯 Result

After these steps:
- ✅ **Repository is public** - anyone can view and fork
- ✅ **Main branch is protected** - contributors must use PRs
- ✅ **vroche can push directly** - admin bypass enabled
- ✅ **Only vroche can approve PRs** - for contributor changes
- ✅ **Contributors can fork and submit PRs**
- ✅ **Marketplace publishing links work** (public repo)

## 🚨 Important Notes

- **vroche can push directly** to main branch (admin bypass enabled)
- **Contributors must use PRs** which vroche must approve
- **Emergency access**: Repository admins can always bypass protections
- **Update README links**: Your marketplace README links will now work since repo is public
- **Consider adding CI/CD**: You can add GitHub Actions for automated testing

## 🚨 Troubleshooting Push Issues

### **Error: "Changes must be made through a pull request"**

If you get this error when pushing:
```
GH013: Repository rule violations found for refs/heads/main
- Changes must be made through a pull request.
```

**Solution:**
1. Go to **Settings** → **Rules** in your repository
2. **Delete or disable** any repository rules affecting the main branch
3. Repository rules override branch protection rules
4. After removing repository rules, you can push directly

### **Quick Fix:**
- Visit: https://github.com/derivative-programming/vscode-extension/rules
- Delete any rules that mention "pull request" requirements
- Then try pushing again

### **Alternative: Use Pull Requests**
If you prefer to keep the rules:
1. Create a new branch: `git checkout -b my-changes`
2. Push the branch: `git push origin my-changes`
3. Create a PR from the GitHub website
4. Merge the PR (you can approve your own PRs)

---

**Your repository will be public with flexible protection - vroche has full control! 🎉**
