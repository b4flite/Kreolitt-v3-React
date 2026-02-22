# Client Handover Guide: Kreol Island Tours App

## 1. Hosting & Database Costs (The Good News)
Based on your estimated volume of **5 bookings per day**, the application fits comfortably within the **Free Tiers** of the providers we have chosen.

### Frontend Hosting (Render)
*   **Verdict:** ✅ **Free Tier is sufficient.**
*   **Why:** The application is deployed as a "Static Site". This means it consumes very little processing power. Render's free tier offers 100GB of bandwidth per month.
*   **Traffic Estimate:** 5 bookings/day ≈ 3,000 page views/month. This is well below the 100GB limit.

### Database (Supabase)
*   **Verdict:** ✅ **Free Tier is sufficient.**
*   **Storage:** Includes 500MB of data. Text data for bookings is tiny; you can store roughly 100,000 bookings before hitting this limit.
*   **Images:** Includes 1GB of file storage. The app automatically compresses images before uploading. This is enough for hundreds of gallery photos.
*   **Users:** Supports up to 50,000 monthly active users.
*   **Important Note:** Free databases on Supabase "pause" after 7 days of inactivity. Since you expect daily bookings, this should not happen. However, if the business closes for a holiday week, the first person to visit the site afterwards might wait 30 seconds for it to "wake up."
    *   *Optional Upgrade:* The "Pro" plan ($25/month) removes the pausing risk and includes daily backups.

---

## 2. The Requirement: Domain Name & Email
While the app works now, it is currently using a temporary address (e.g., `kreol-tours.onrender.com`). To run a professional business and **send automated booking confirmations**, you need to purchase a custom domain.

### Why you need this:
1.  **Trust:** Customers trust `kreoltours.sc` more than a generic link.
2.  **Email Deliverability:** To send automated emails (e.g., "Booking Confirmed"), we must prove we own the domain. Sending from `@gmail.com` via code will result in emails going to Spam folders.

### Estimated Costs

| Item | Cost Estimate | Notes |
| :--- | :--- | :--- |
| **Domain Name** | **$15 - $100 / year** | `.com` is cheaper (~$15). `.sc` (Seychelles) is authoritative but expensive (~$90-$120/year). |
| **Business Email** | **$6 / user / month** | Google Workspace or Microsoft 365. Gives you `reservations@kreoltours.sc`. |
| **Email API** | **Free** | We can use **Resend.com**. Their free tier allows 3,000 emails/month, which covers your 5 bookings/day comfortably. |

---

## 3. Technical: Sending Emails from the App
You asked about sending emails directly from the web app. I have updated the application code to support this, but for security reasons, the email logic must run on the server side (Supabase), not in the browser.

I have set up the app to call a secure function named `send-email`. You (or your IT provider) must deploy this function to Supabase.

### Step-by-Step Activation:
1.  **Sign up for Resend.com** (Free tier). Verify your domain name there.
2.  **Get API Key:** Copy the API Key from Resend.
3.  **Deploy Edge Function:** In your Supabase dashboard, go to "Edge Functions".
4.  **Create Function:** Create a new function named `send-email` and use the Deno code below:

```typescript
// Supabase Edge Function: send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  const { type, recipient, name, data } = await req.json()

  let subject = "Booking Update";
  let html = "";

  if (type === 'NEW_BOOKING') {
      subject = `Booking Confirmation: ${data.reference}`;
      html = `<h1>Thank you, ${name}!</h1><p>Your booking (Ref: ${data.reference}) is received.</p>`;
  } else if (type === 'INVOICE_GENERATED') {
      subject = `Invoice #${data.invoiceNumber}`;
      html = `<h1>Invoice Ready</h1><p>Amount: SCR ${data.amount}</p><a href="${data.link}">View Invoice</a>`;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Reservations <bookings@yourdomain.sc>', // Update this!
      to: recipient,
      subject: subject,
      html: html
    })
  })

  const dataRes = await res.json()
  return new Response(JSON.stringify(dataRes), {
    headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
  })
})
```
5.  **Set Secret:** In Supabase settings, add a secret named `RESEND_API_KEY` with your key.

**Until this is done, the app will simulate sending emails (showing a success message) but no actual email will be delivered.**

---

## 4. Next Steps
To go live properly, please provide the following:

1.  **Purchase your Domain:** I recommend [Namecheap](https://namecheap.com) or a local Seychelles registrar if you want a `.sc` domain.
2.  **Set up Business Email:** Create an account like `info@` or `bookings@` on your new domain.
3.  **DNS Access:** Once purchased, I will need access to the DNS settings to point the website URL to the app.

## 5. Maintenance
*   **Backups:** The "Settings" page in your dashboard allows you to download a full JSON backup of your data at any time. I recommend doing this once a week.
*   **Support:** If you need features changed or the system scales beyond 50 bookings/day, we can discuss upgrading the server capacity.
