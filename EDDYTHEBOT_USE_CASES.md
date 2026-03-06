# EddyTheBot Agentic Use Cases

A comprehensive list of use cases leveraging EddyTheBot's agentic abilities — its 11 built-in tools, skills system, persistent memory, heartbeat/cron scheduling, and multi-channel integrations (Telegram, Discord, WhatsApp).

---

## 🔧 Core Tool Capabilities

EddyTheBot has access to these agentic tools:

| Tool | What It Can Do |
|------|---------------|
| `filesystem` | Read, write, and list files on the host machine |
| `exec` | Run any shell command |
| `web` | Fetch web content from URLs |
| `message` | Send messages to any connected channel |
| `spawn` | Launch background sub-agents for parallel work |
| `cron` | Schedule one-time or recurring tasks |
| `write_memory` | Persist information across conversations |
| `create_skill` / `list_skills` / `read_skill` / `delete_skill` | Self-extending modular knowledge system |

---

## 📊 Monitoring & Alerts

### 1. Website Health Monitor
> **Tools:** `exec` + `web` + `cron` + `message`

Set up a recurring check every 5 minutes that pings your websites and alerts you on Telegram/Discord if any go down.

```
"Every 5 minutes, curl https://mysite.com. If the HTTP status is not 200, message me on Telegram with the status code and response time."
```

### 2. Server Resource Monitor
> **Tools:** `exec` + `cron` + `message`

Monitor CPU, RAM, and disk usage on the host machine. Alert when thresholds are exceeded.

```
"Every 10 minutes, check disk usage with df -h. If any partition exceeds 85%, alert me on Discord."
```

### 3. Log File Watcher
> **Tools:** `filesystem` + `exec` + `cron` + `message`

Tail log files for error patterns and alert you when critical errors appear.

```
"Every 2 minutes, check /var/log/app.log for lines containing ERROR or CRITICAL. Send me any new matches on Telegram."
```

### 4. SSL Certificate Expiry Checker
> **Tools:** `exec` + `cron` + `message`

Check when SSL certs are expiring and warn you in advance.

```
"Every day, check the SSL certificate expiry for mysite.com, api.mysite.com. Alert me if any expire within 14 days."
```

### 5. Docker Container Monitor
> **Tools:** `exec` + `cron` + `message`

Watch running Docker containers and alert on crashes or restarts.

```
"Every 5 minutes, run docker ps. If any container has restarted or is in an unhealthy state, alert me."
```

---

## 💰 Crypto & Finance

### 6. Crypto Price Alerts
> **Tools:** `web` + `cron` + `message` + `write_memory`

Track crypto prices using public APIs and alert on significant moves.

```
"Every 5 minutes, fetch the BTC price from CoinGecko API. If it changes by more than 3% from the last recorded price, alert me on Telegram."
```

### 7. Whale Transaction Tracker
> **Tools:** `web` + `cron` + `message` + `write_memory`

Monitor large transactions on-chain via public APIs.

```
"Every 2 minutes, check the DexScreener API for transactions over $50k on SOL pairs. Log each one to memory and send me the details."
```

### 8. Portfolio Valuation Reporter
> **Tools:** `web` + `cron` + `message` + `filesystem`

Generate daily portfolio summary reports.

```
"Every morning at 8am, fetch prices for BTC, ETH, SOL. Calculate my portfolio value using the holdings in portfolio.json. Send me a summary on Telegram."
```

---

## 📰 Information & Research

### 9. Daily News Digest
> **Tools:** `web` + `cron` + `message` + `write_memory`

Fetch, summarise, and deliver a daily news briefing to your phone.

```
"Every morning at 7am, fetch the top headlines from TechCrunch, Hacker News, and CoinDesk. Summarise the top 5 stories and send them to my Telegram."
```

### 10. Competitor Price Monitor
> **Tools:** `web` + `cron` + `filesystem` + `message`

Scrape competitor pricing pages and alert on changes.

```
"Daily at 9am, fetch the pricing page from competitor.com. Compare with yesterday's saved version. If anything changed, alert me with the differences."
```

### 11. API Documentation Watcher
> **Tools:** `web` + `cron` + `write_memory` + `message`

Track changes to API docs you depend on.

```
"Weekly, fetch the OpenRouter API docs page. Compare with the last saved version. If there are changes, summarise them and notify me."
```

---

## 🗂️ File & System Management

### 12. Automated Backup Manager
> **Tools:** `exec` + `filesystem` + `cron` + `message`

Schedule automated backups of critical directories.

```
"Every night at 2am, tar and compress /home/user/projects. Upload to the backup directory. If the backup fails, alert me. Keep only the last 7 backups."
```

### 13. Database Maintenance Bot
> **Tools:** `exec` + `cron` + `message`

Run scheduled database maintenance tasks.

```
"Every Sunday at 3am, run VACUUM and ANALYZE on the SQLite database at /data/EddyTheBot.db. Report the result and the new file size."
```

### 14. Disk Cleanup Automation
> **Tools:** `exec` + `filesystem` + `cron`

Automatically clean up temp files, old logs, and caches.

```
"Every day, delete files older than 30 days from /tmp and /var/log/*.gz. Report how much space was freed."
```

### 15. Git Repository Reporter
> **Tools:** `exec` + `cron` + `message` + `filesystem`

Daily summary of git activity across your projects.

```
"Every evening, run git log --since=today in each project folder. Send me a summary of today's commits across all repos."
```

---

## 🤖 DevOps & Automation

### 16. CI/CD Pipeline Monitor
> **Tools:** `web` + `cron` + `message`

Watch GitHub Actions or other CI systems for failed builds.

```
"Every 10 minutes, check the GitHub API for failed workflow runs in my repos. Alert me on Discord with the failure details."
```

### 17. Environment Health Dashboard
> **Tools:** `exec` + `web` + `cron` + `filesystem`

Generate a periodic system health report and save it.

```
"Every hour, collect: CPU usage, memory, disk, running containers, open ports, pending updates. Write a report to /reports/health-YYYYMMDD-HH.md."
```

### 18. DNS & Domain Monitor
> **Tools:** `exec` + `cron` + `message`

Monitor DNS records for unexpected changes.

```
"Daily, resolve DNS for all my domains and compare with the expected records in domains.json. Alert on any mismatches."
```

### 19. Process Watchdog
> **Tools:** `exec` + `cron` + `message`

Auto-restart crashed services and notify you.

```
"Every minute, check if nginx is running. If not, restart it with systemctl restart nginx and alert me that it was restarted."
```

---

## 🧠 Self-Extending Skills

### 20. Self-Building Knowledge Base
> **Tools:** `create_skill` + `write_memory` + `web`

Ask EddyTheBot to research a topic and create a permanent skill from it.

```
"Research the best practices for Docker security. Create a skill called docker-security with the key findings so you can reference it in the future."
```

### 21. Custom API Integration Skills
> **Tools:** `create_skill` + `web` + `exec`

Teach EddyTheBot to interact with any API.

```
"Create a skill for interacting with the GitHub API. Include how to list repos, create issues, and check workflow status using curl with my token."
```

### 22. Runbook Automation
> **Tools:** `create_skill` + `exec` + `filesystem`

Create operational runbooks that EddyTheBot can execute on demand.

```
"Create a skill called deploy-production with the exact steps: git pull, npm install, npm run build, pm2 restart app. When I say 'deploy to prod', follow these steps."
```

---

## 💬 Multi-Channel Communication

### 23. Cross-Channel Message Relay
> **Tools:** `message` + `cron`

Relay messages or reports across Telegram, Discord, and WhatsApp.

```
"When you generate the daily report, send it to both my Telegram and Discord server."
```

### 24. Personal Assistant via WhatsApp
> **Tools:** All tools via WhatsApp channel

Use WhatsApp as a natural interface to control your server.

```
WhatsApp: "What's the CPU usage on the server?"
EddyTheBot: "Current CPU: 23%, Memory: 1.2GB/4GB, Load: 0.45"
```

### 25. Emergency Alert System
> **Tools:** `exec` + `cron` + `message`

Critical alerts that reach you across all channels simultaneously.

```
"If the main app process dies, send an URGENT message to Telegram AND Discord AND WhatsApp immediately."
```

---

## 📝 Personal Productivity

### 26. Daily Standup Summariser
> **Tools:** `write_memory` + `cron` + `message`

Auto-generate standup reports from accumulated memory.

```
"Every morning at 8:30am, review my memory from the last 24 hours and generate a standup summary: what I did, what I'm planning, any blockers."
```

### 27. Reminder & Follow-Up System
> **Tools:** `cron` + `message` + `write_memory`

Natural language reminders with follow-up tracking.

```
"Remind me in 2 hours to check the deployment. Then remind me again tomorrow morning to verify the metrics."
```

### 28. Meeting Notes Taker
> **Tools:** `filesystem` + `write_memory` + `message`

Save and recall meeting notes.

```
"Save these meeting notes: Team decided to migrate to PostgreSQL. Timeline: 2 weeks. Owner: Damian. Add to my memory and create a reminder for the deadline."
```

---

## 🔄 Background Sub-Agents

### 29. Parallel Research Agent
> **Tools:** `spawn` + `web` + `write_memory`

Launch multiple sub-agents to research topics in parallel.

```
"Spawn 3 sub-agents to research: (1) best Node.js hosting platforms, (2) PostgreSQL vs MySQL for our use case, (3) CI/CD options for small teams. Compile the results."
```

### 30. Long-Running Task Manager
> **Tools:** `spawn` + `exec` + `message`

Delegate long-running tasks to background agents.

```
"Spawn a sub-agent to run the full test suite. When it finishes, send me the pass/fail summary on Telegram."
```

---

## 🏠 IoT / Smart Home (Raspberry Pi)

### 31. Home Network Monitor
> **Tools:** `exec` + `cron` + `message`

EddyTheBot runs on a Pi with 256MB RAM — perfect for home monitoring.

```
"Every 5 minutes, ping all devices on 192.168.1.0/24. Alert me when a new device appears or a known device goes offline."
```

### 32. Temperature & Sensor Logger
> **Tools:** `exec` + `filesystem` + `cron` + `message`

Read sensor data via the Pi's GPIO and log it.

```
"Every 10 minutes, read the temperature sensor and log to temperature.csv. If temperature exceeds 35°C, alert me."
```

---

## 🔗 Integration Patterns

### 33. Webhook Receiver
> **Tools:** `web` + `exec` + `message`

Process incoming webhooks from services like GitHub, Stripe, or Netlify.

```
"When you receive a GitHub webhook for a push event, run the deploy script and report the result."
```

### 34. Email-to-Action Bridge
> **Tools:** `exec` + `filesystem` + `cron` + `message`

Poll an email inbox and take action on certain messages.

```
"Every 5 minutes, check for new emails with subject 'DEPLOY'. If found, trigger the deploy runbook skill."
```

### 35. RSS Feed Monitor
> **Tools:** `web` + `cron` + `write_memory` + `message`

Track RSS feeds and deliver relevant articles.

```
"Every hour, check the Hacker News RSS. If any post mentions 'AI agents' or 'Go lang', send it to my Telegram."
```

---

## Key Advantages of EddyTheBot

| Feature | Benefit |
|---------|---------|
| **Single binary, ~13-31MB** | Runs anywhere — VPS, Raspberry Pi, old laptop |
| **256MB RAM minimum** | No heavy infrastructure required |
| **Self-extending skills** | Agent learns and improves over time |
| **Persistent memory** | Remembers context across conversations |
| **Multi-channel** | Telegram + Discord + WhatsApp + Web UI |
| **Natural language cron** | Schedule anything without crontab syntax |
| **Background sub-agents** | Parallelise complex tasks |
| **Any LLM provider** | OpenRouter, OpenAI, Ollama, or any compatible API |

---

> **Note:** Most scheduled/recurring use cases require EddyTheBot running in **gateway mode** (`EddyTheBot gateway`) rather than single-shot mode. The gateway keeps the heartbeat, cron scheduler, and channel listeners active.
