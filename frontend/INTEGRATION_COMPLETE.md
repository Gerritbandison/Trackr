# 🚀 Integration System - Complete Guide

> **Status:** ✅ Production Ready | **Version:** 2.0 | **Last Updated:** January 2025

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Available Integrations](#available-integrations)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [API Documentation](#api-documentation)
5. [Troubleshooting](#troubleshooting)
6. [Security & Best Practices](#security--best-practices)

---

## 🎯 Quick Start

### Prerequisites
- ✅ Admin or Manager role
- ✅ Backend running on port 5000
- ✅ Frontend running on port 5174
- ✅ MongoDB connected

### Connect Your First Integration (5 Minutes)

1. **Access Settings**
   ```
   URL: http://localhost:5174/settings
   Navigate: Settings → Integrations Tab
   ```

2. **Choose Integration**
   - Scroll to find the integration you want
   - Recommended: Start with **Lansweeper** (easiest)

3. **Click "Connect"**
   - Configuration modal opens
   - Choose authentication type
   - Enter credentials

4. **Test Connection**
   - Click "Test Connection" button
   - Wait for green success message
   - Fix any errors before proceeding

5. **Save & Enable**
   - Click "Save & Connect"
   - Status changes to "✓ Connected"
   - Integration is now active

---

## 🔌 Available Integrations

### ✅ Fully Configured (13+)

| Integration | Type | Authentication | Status | Use Case |
|------------|------|----------------|--------|----------|
| **Lansweeper** | Asset Discovery | API Key | Ready | Scan network assets |
| **Microsoft Entra ID** | Identity | OAuth 2.0 | Ready | User/device sync |
| **Microsoft Intune** | MDM | OAuth 2.0 | Ready | Mobile device management |
| **LLDP** | Network | Protocol | Ready | Network topology |
| **PRTG Network Monitor** | Monitoring | API Key | Ready | Network monitoring |
| **ServiceNow** | ITSM | OAuth 2.0 | Ready | Service management |
| **Jira** | ITSM | OAuth 2.0 | Ready | Issue tracking |
| **Confluence** | Wiki | OAuth 2.0 | Ready | Documentation |
| **GitHub** | Code Repo | OAuth 2.0 | Ready | Version control |
| **AWS** | Cloud | IAM Role | Ready | Cloud resources |
| **Azure** | Cloud | OAuth 2.0 | Ready | Cloud resources |
| **Google Workspace** | Productivity | OAuth 2.0 | Ready | Google services |
| **CDW** | Procurement | API Key | Ready | Purchase products |

---

## 📖 Step-by-Step Setup

### Lansweeper Integration (Recommended First)

#### 1. Get Your API Key

**Option A: Lansweeper Cloud**
1. Login: https://app.lansweeper.com
2. Go to: Settings → API Keys
3. Click: "Generate New Key"
4. Copy: The generated key

**Option B: Test Mode**
- Use: `test-lansweeper-key-12345` (for testing only)

#### 2. Configure in ITAM

```javascript
{
  "name": "lansweeper",
  "displayName": "Lansweeper",
  "type": "api-key",
  "apiKey": {
    "key": "YOUR_ACTUAL_KEY_HERE",
    "endpoint": "https://api.lansweeper.com/api/v2"
  },
  "autoSync": true,
  "syncInterval": 360 // 6 hours in minutes
}
```

#### 3. Verify Connection

- Status should show: **"✓ Connected"**
- Last sync: Shows recent timestamp
- Error count: 0

---

### Microsoft Entra ID (Azure AD)

#### Prerequisites
- Azure subscription
- Admin access to Azure Portal
- Permissions to register applications

#### 1. Register Application

1. **Azure Portal**
   - URL: https://portal.azure.com
   - Navigate: Azure Active Directory → App registrations

2. **Create Registration**
   ```
   Name: ITAM Asset Management System
   Supported account types: Single tenant
   Redirect URI: https://yourdomain.com/auth/callback
   ```

3. **Get Credentials**
   - Client ID: Copy from Overview
   - Tenant ID: Copy from Overview
   - Client Secret: Create in Certificates & secrets

#### 2. Configure Permissions

**Required Permissions:**
```
✓ Directory.Read.All (Application)
✓ User.Read.All (Application)
✓ DeviceManagementManagedDevices.Read.All (Application)
✓ LicenseAssignment.ReadWrite.All (Application)
```

**Action:** Click "Grant admin consent"

#### 3. Configure in ITAM

```javascript
{
  "name": "entra-id",
  "displayName": "Microsoft Entra ID",
  "type": "oauth",
  "oauth": {
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET",
    "tenantId": "YOUR_TENANT_ID",
    "authorizationUrl": "https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/authorize",
    "tokenUrl": "https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token"
  },
  "autoSync": true,
  "syncInterval": 240 // 4 hours
}
```

---

### Microsoft Intune (MDM)

#### Setup Steps

1. **Register App** (same as Entra ID)
2. **Add Permissions:**
   ```
   ✓ DeviceManagementManagedDevices.Read.All
   ✓ DeviceManagementManagedDevices.ReadWrite.All
   ```

3. **Configure in ITAM:**
   - Type: OAuth 2.0
   - Use same credentials as Entra ID
   - Endpoint: Microsoft Graph API

---

## 🔧 API Documentation

### Endpoints

#### Get All Integrations
```http
GET /api/v1/integration-configs
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "lansweeper",
      "displayName": "Lansweeper",
      "type": "api-key",
      "status": "connected",
      "lastSync": "2025-01-15T10:30:00Z",
      "errorCount": 0
    }
  ]
}
```

#### Create/Update Configuration
```http
POST /api/v1/integration-configs
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "lansweeper",
  "displayName": "Lansweeper",
  "type": "api-key",
  "apiKey": {
    "key": "your-key",
    "endpoint": "https://api.lansweeper.com/api/v2"
  },
  "autoSync": true,
  "syncInterval": 360
}
```

#### Test Connection
```http
POST /api/v1/integration-configs/{name}/test
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Connection successful",
  "data": {
    "responseTime": 245,
    "version": "2.1.3"
  }
}
```

#### Toggle Integration
```http
PATCH /api/v1/integration-configs/{name}/toggle
Authorization: Bearer {token}
```

#### Delete Configuration
```http
DELETE /api/v1/integration-configs/{name}
Authorization: Bearer {token}
```

---

## 🐛 Troubleshooting

### Common Issues

#### ❌ "Connection Failed"

**Symptoms:**
- Red error message
- Status shows "Disconnected"
- High error count

**Solutions:**
1. **Check Credentials**
   - Verify API key is correct
   - Ensure no extra spaces
   - Check if key expired

2. **Check Network**
   ```bash
   curl https://api.lansweeper.com/api/v2
   # Should return API response
   ```

3. **Check Permissions**
   - Verify API key has correct permissions
   - Check OAuth consent granted

4. **Check Endpoint**
   - Verify endpoint URL is correct
   - Check for typos
   - Ensure HTTPS is used

#### ❌ "Modal Won't Open"

**Symptoms:**
- Button does nothing
- No error messages
- Browser console shows errors

**Solutions:**
1. **Clear Browser Cache**
   ```
   Ctrl + Shift + Delete
   Clear cache and reload
   ```

2. **Check Console**
   ```
   F12 → Console Tab
   Look for red errors
   ```

3. **Verify Component**
   - Check file exists: `src/components/Common/IntegrationConfigModal.jsx`
   - Verify import in Settings.jsx

#### ❌ "Configuration Not Saving"

**Symptoms:**
- Click save but nothing happens
- Credentials lost after refresh
- Status doesn't update

**Solutions:**
1. **Test Connection First**
   - Must test before saving
   - Fix any test errors

2. **Check Backend Logs**
   ```bash
   # Look for errors in backend terminal
   # Should see successful POST request
   ```

3. **Verify Authentication**
   - Must be logged in as admin/manager
   - Token must be valid

#### ❌ "Sync Not Working"

**Symptoms:**
- Last sync never updates
- No data appearing
- Sync errors accumulating

**Solutions:**
1. **Check Auto-Sync Enabled**
   - Settings modal
   - Check "Enable Auto-Sync" box

2. **Verify Sync Interval**
   - Minimum: 60 minutes
   - Recommended: 240-360 minutes

3. **Check Backend Jobs**
   ```bash
   # Backend should log sync attempts
   # Check for errors in sync logs
   ```

---

## 🔐 Security & Best Practices

### Credential Storage

✅ **Encrypted at Rest**
- All credentials encrypted with AES-256
- Keys never stored in plain text
- Database encrypted

✅ **Secure Transmission**
- HTTPS only
- TLS 1.2+ required
- No credentials in URLs

✅ **Access Control**
- Admin/Manager only
- Role-based permissions
- Audit logging enabled

### Best Practices

#### 1. Use Strong Credentials
- API keys: 32+ characters
- OAuth secrets: Generated securely
- Rotate regularly (90 days)

#### 2. Principle of Least Privilege
- Grant minimum required permissions
- Read-only when possible
- Separate read/write keys

#### 3. Monitor Regularly
- Check error counts weekly
- Review sync logs monthly
- Audit access quarterly

#### 4. Disaster Recovery
- Export configurations
- Backup encrypted credentials
- Document recovery procedures

---

## 📊 Monitoring & Health

### Status Indicators

#### ✓ Connected (Green)
- All systems operational
- Recent successful sync
- No errors

#### ⚠️ Warning (Yellow)
- Sync delayed
- Minor errors
- Requires attention

#### ❌ Disconnected (Red)
- Connection failed
- Credentials invalid
- Critical errors

### Health Checks

**Automated:**
- Every 5 minutes: Connection test
- Every sync interval: Data sync
- Daily: Error count reset

**Manual:**
```bash
# Test specific integration
curl -X POST http://localhost:5000/api/v1/integration-configs/{name}/test \
  -H "Authorization: Bearer {token}"
```

---

## 📈 Success Metrics

### Track These KPIs

1. **Connection Uptime**
   - Target: 99.5%
   - Monitor: Daily

2. **Sync Success Rate**
   - Target: 95%+
   - Monitor: Per sync

3. **Error Rate**
   - Target: <1%
   - Monitor: Weekly

4. **Response Time**
   - Target: <500ms
   - Monitor: Per request

---

## 🎓 Training Resources

### For IT Managers

1. **Quick Setup Guide** (this document)
2. **Video Tutorial**: Coming soon
3. **API Reference**: `/docs/api`
4. **Support**: support@itam.com

### For Administrators

1. **Security Best Practices** (above)
2. **Audit Logging**: Check audit-logs table
3. **Troubleshooting Guide** (above)
4. **Emergency Contacts**: IT Support 24/7

---

## 🚀 Next Steps

### Immediate Actions

1. ✅ Connect Lansweeper (test environment)
2. ✅ Verify sync working
3. ✅ Check error logs
4. ✅ Document credentials

### Week 1

1. Connect production integrations
2. Configure auto-sync schedules
3. Train team members
4. Set up monitoring

### Month 1

1. Review sync patterns
2. Optimize sync intervals
3. Expand integrations
4. Refine processes

---

## 📞 Support

### Get Help

**Email:** support@itam.com  
**Phone:** 1-800-ITAM-HELP  
**Portal:** https://support.itam.com  
**Hours:** 24/7/365

### Report Issues

Include:
- Integration name
- Error message
- Steps to reproduce
- Screenshots/logs

---

## ✅ Checklist

### Before Production

- [ ] All credentials secured
- [ ] OAuth apps registered
- [ ] Permissions granted
- [ ] Auto-sync configured
- [ ] Monitoring enabled
- [ ] Team trained
- [ ] Documentation reviewed
- [ ] Backup procedures tested

### Weekly Maintenance

- [ ] Check all integrations connected
- [ ] Review error logs
- [ ] Verify sync timestamps
- [ ] Update credentials if needed
- [ ] Review access logs

---

**Version:** 2.0  
**Last Updated:** January 15, 2025  
**Status:** ✅ Production Ready  
**Next Review:** February 15, 2025
