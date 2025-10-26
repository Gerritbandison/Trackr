# Microsoft Licenses Supported

This document lists all Microsoft licenses that are now tracked and supported in the Microsoft Graph integration.

## License Categories

### 📧 Office 365 / Microsoft 365
- **Microsoft 365 E5** - $57/month
- **Microsoft 365 E3** - $32/month
- **Microsoft 365 F3** - $8/month
- **Microsoft 365 Business Premium** - $22/month
- **Microsoft 365 Business Standard** - $12.50/month
- **Microsoft 365 Business Basic** - $6/month
- **Office 365 E5** - $38/month
- **Office 365 E3** - $23/month
- **Office 365 E1** - $10/month
- **Office 365 F3** - $8/month

### 🪟 Windows
- **Windows Enterprise E5** - $16/month
- **Windows Enterprise E3** - $10/month
- **Windows 10 Enterprise E5** - $16/month
- **Windows 10 Enterprise E3** - $10/month

### 🔒 Security & Compliance
- **Enterprise Mobility + Security E5** - $22/month
- **Enterprise Mobility + Security E3** - $8.75/month
- **Microsoft Defender for Office 365** - $5/month
- **Microsoft Intune** - $8/month
- **Azure Information Protection** - $2/month
- **Microsoft Purview Compliance** - $1/month
- **Microsoft Purview** - $1/month
- **Information Protection** - $2/month

### ⚡ Power Platform
- **Power BI Premium** - $20/month
- **Power BI Pro** - $10/month
- **Power Apps Per App** - $5/month
- **Power Apps Per User** - $20/month
- **Power Automate Per Flow** - $15/month
- **Power Per User** - $20/month

### 💼 Dynamics 365
- **Dynamics 365 Sales Enterprise** - $95/month
- **Dynamics 365 Sales Professional** - $65/month
- **Dynamics 365 Customer Engagement Plan** - $115/month
- **Dynamics 365 Customer Service** - $50/month
- **Dynamics 365 Field Service** - $95/month
- **Dynamics 365 Marketing** - $1,500/month
- **Dynamics 365 Team Members** - $8/month
- **Dynamics 365 Operations Activity** - $180/month
- **Dynamics 365 Operations** - $180/month
- **Dynamics 365 Finance and Operations** - $180/month
- **Dynamics 365 Retail** - $110/month
- **Dynamics 365 HR** - $120/month

### 💬 Teams
- **Teams Premium** - $10/month
- **Teams Essentials** - $4/month
- **Phone System** - $8/month
- **Audio Conferencing** - $4/month

### 📊 Visio
- **Visio Plan 2** - $15/month
- **Visio Plan 1** - $5/month
- **Visio Pro Online** - $15/month

### 📅 Project
- **Project Plan 3** - $30/month
- **Project Plan 1** - $10/month
- **Project Plan 5** - $55/month
- **Project Online** - $30/month

### 📮 Exchange
- **Exchange Online Plan 2** - $8/month
- **Exchange Online Plan 1** - $4/month
- **Exchange Online Archiving** - $3/month

### 🌐 SharePoint
- **SharePoint Online** - $5/month
- **SharePoint Plan 2** - $8/month
- **SharePoint Plan 1** - $5/month

### ☁️ Azure Active Directory
- **Azure Active Directory Premium P2** - $9/month
- **Azure Active Directory Premium P1** - $6/month
- **Azure AD Basic** - $1/month

### 🎓 Education Licenses
- **Microsoft 365 A1** - Free
- **Microsoft 365 A3** - $2.50/month
- **Microsoft 365 A5** - $6/month

### 🏢 Other Microsoft Services
- **Enterprise licenses** (E5) - $35/month (estimated)
- **Enterprise licenses** (E3) - $20/month (estimated)
- **Professional licenses** - $15/month (estimated)
- **Premium licenses** - $25/month (estimated)
- **Basic licenses** - $5/month (estimated)
- **Standard licenses** - $10/month (estimated)
- **Nonprofit licenses** - Free

## Complete License Coverage

The system now automatically recognizes and categorizes **over 100+ Microsoft license types** including:

### Product Families Covered:
1. ✅ **Microsoft 365** - All variants (E1, E3, E5, F1, F3, Business)
2. ✅ **Office 365** - All enterprise and business plans
3. ✅ **Windows** - Enterprise licensing for desktops and servers
4. ✅ **Microsoft Teams** - All communication plans
5. ✅ **Power Platform** - Power BI, Power Apps, Power Automate
6. ✅ **Dynamics 365** - All CRM and ERP modules
7. ✅ **Security Products** - Defender, Intune, Compliance, Purview
8. ✅ **Exchange** - Email and calendaring services
9. ✅ **SharePoint** - Collaboration and document management
10. ✅ **Azure AD** - Identity and access management
11. ✅ **Project** - Project management solutions
12. ✅ **Visio** - Diagramming and visualization
13. ✅ **Education** - Academic pricing and plans
14. ✅ **Nonprofit** - Discounted licensing programs

## Features

### Automatic Categorization
All licenses are automatically categorized based on their SKU part number, making it easy to:
- Track usage by product family
- Analyze costs by category
- Identify underutilized license groups

### Comprehensive Pricing
- Includes current Microsoft pricing for all major SKUs
- Monthly cost calculations
- Total tenant spend visibility
- Cost optimization insights

### User Assignment Tracking
- See which users have which licenses
- Identify duplicate or unnecessary assignments
- Track license utilization rates

### Billing Insights
- Monthly cost per license type
- Total tenant spend
- Next billing date tracking
- Savings potential identification

## How It Works

1. **Sync Process**: Connects to Microsoft Graph API using Azure AD credentials
2. **Fetch Subscriptions**: Retrieves all subscribed SKUs from your tenant
3. **Get User Assignments**: Determines which users have which licenses
4. **Calculate Costs**: Applies pricing data to each license type
5. **Categorize Licenses**: Automatically groups licenses by product family
6. **Display Results**: Shows comprehensive dashboard with all license data

## Supported License Types

The system recognizes and displays:
- ✅ All SKU part numbers
- ✅ Service plans included in each license
- ✅ Available vs. assigned seats
- ✅ License status (active, low stock, exhausted)
- ✅ Monthly pricing
- ✅ User assignments
- ✅ Last sync timestamp

## Benefits

1. **Complete Visibility**: See all Microsoft licenses in one place
2. **Cost Optimization**: Identify unused licenses and reduce spend
3. **Compliance**: Track license assignments and ensure proper usage
4. **Planning**: Understand current license mix for better procurement decisions
5. **Automation**: Eliminate manual license tracking spreadsheets

## Technical Details

- **API**: Microsoft Graph REST API
- **Authentication**: Azure AD App Registration (Client Credentials)
- **Required Permissions**: 
  - `Directory.Read.All`
  - `User.Read.All`
  - `Organization.Read.All`
- **Data Storage**: MongoDB with MicrosoftLicense model
- **Update Frequency**: Manual sync or scheduled sync (future)

## Pricing Notes

⚠️ **Important**: Pricing shown is estimated based on Microsoft's published rates. Actual pricing may vary based on:
- Enterprise Agreement (EA) discounts
- Academic pricing
- Nonprofit discounts
- Volume licensing agreements
- Contract negotiation

For accurate billing information, refer to your Microsoft admin center or billing portal.

