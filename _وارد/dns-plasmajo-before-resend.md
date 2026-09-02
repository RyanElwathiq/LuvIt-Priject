# لقطة DNS · plasmajo.com · قبل إضافة سجلات Resend

**التاريخ:** ٢ أيلول ٢٠٢٦
**المصدر:** لوحة هوستنجر · `hpanel.hostinger.com/domain/plasmajo.com/dns`
**Nameservers:** `aurora.dns-parking.com` · `nebula.dns-parking.com`

🔴 **ليش انحفظت:** قبل ما ينضاف تلات سجلات لـResend. لو انكسر إيميل
هوستنجر، هاي هي الحالة اللي بينرجعلها.

| Type | Name | Prio | Content | TTL |
|---|---|---|---|---|
| CNAME | hostingermail-c._domainkey | 0 | hostingermail-c.dkim.mail.hostinger.com | 300 |
| CNAME | hostingermail-b._domainkey | 0 | hostingermail-b.dkim.mail.hostinger.com | 300 |
| CNAME | hostingermail-a._domainkey | 0 | hostingermail-a.dkim.mail.hostinger.com | 300 |
| CNAME | www | 0 | www.plasmajo.com.cdn.hstgr.net | 300 |
| CNAME | autodiscover | 0 | autodiscover.mail.hostinger.com | 300 |
| A | ftp | 0 | 82.198.228.4 | 1800 |
| CNAME | autoconfig | 0 | autoconfig.mail.hostinger.com | 300 |
| TXT | _dmarc | 0 | "v=DMARC1; p=none" | 3600 |
| ALIAS | @ | 0 | plasmajo.com.cdn.hstgr.net | 300 |
| TXT | @ | 0 | "v=spf1 include:_spf.mail.hostinger.com ~all" | 3600 |
| MX | @ | 10 | mx2.hostinger.com | 14400 |
| MX | @ | 5 | mx1.hostinger.com | 14400 |

## اللي انضاف بعدها · Resend (الإرسال فقط)

| Type | Name | Content | TTL |
|---|---|---|---|
| TXT | resend._domainkey | p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDOWR3Sl0xRBTdNsfcftjaGo+tIfRD5e2V8MXgifIp/Ph/zJ3990yEEYoFrlHoK8cJkFQFNtOBgVSY9SbitWKlr/KWegfevlmI1oayYpK6fKtso5OIDo8kgUPdxgW664l8ipnBJsjsPzPmP5PVA+YV9lIiaLCIMLYNfJuBu4vGJAQIDAQAB | 3600 |
| CNAME | rsend | rsend-euw1.forge.rmta.net | 3600 |
| CNAME | send | send.forge.rmta.net | 3600 |

## 🔴 اللي **ما** انضاف · ومقصود

Resend بيعرض كمان سجل استقبال:

```
MX   @   inbound-smtp.eu-west-1.amazonaws.com   priority 4
```

**ممنوع يضاف.** أولويته `4` وهوستنجر `5`، والأقل بيفوز · يعني كل إيميل
جاي على `info@` و`orders@` بيروح لResend وبيوقف الاستقبال بصندوق هوستنجر.
**الاستقبال بهوستنجر · والإرسال بResend · وهاد الفصل مقصود.**

## وليش الجذر ما انلمس

Resend مسار الـReturn-Path تبعه `send.plasmajo.com` (عَبر الـCNAME)، يعني
الـSPF بينفحص **هناك** مش على الجذر:

- **DKIM** · `resend._domainkey.plasmajo.com` بيوقّع بـ`d=plasmajo.com` → محاذاة صارمة ✅
- **SPF** · بينفحص `send.plasmajo.com` → بيتبع الـCNAME لسجل Resend ✅
- **DMARC** · محاذاة مرنة مع الجذر → بتمرّ ✅

⤷ فسطر `v=spf1 include:_spf.mail.hostinger.com ~all` **بيضل زي ما هو حرفياً**.
⚠️ وكنت قلت قبل إنه بده `include:amazonses.com` · **غلط** · هاد لمسار MX+TXT
   القديم، مش لمسار الـCNAME اللي Resend اختاره هون.
