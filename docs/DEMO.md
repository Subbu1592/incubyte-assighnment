# Demo script

A two-minute recording is enough. The app should already be running (`npm run dev`) with the 10,000-person database.

1. **Overview (30s).** Open `/`. Read the active payroll and median. Point at the rate-card note: USD is a view, local currency is the record. Switch the breakdown from country to department to level.
2. **A market (20s).** Choose India in the country filter. Show that the figures switch to INR, and that “outside the usual range” is India-only, not “paid less than the US.”
3. **Find a person (30s).** Open People. Search a name. Filter to Engineering and a level. Open a profile and show salary history, including a closed record and one current record.
4. **Change pay (30s).** Enter a merit increase effective today. Save. Show the previous row closed the day before, and the new row current. Mention that a terminated employee cannot be changed.
5. **Bands (20s).** Open Pay bands. Show the percentile bar for one level, then filter to one country.

Optional curl, if you want the API on camera:

```bash
curl -s localhost:3000/api/health
curl -s "localhost:3000/api/employees?country=IN&pageSize=2"
```

## Hosting

This repository runs as a Node server with a SQLite file. `Dockerfile` is the deployment unit. Put `data/` on a persistent volume. Do not deploy the database to ephemeral serverless disk. There is no public URL in the repo because publishing it needs your hosting account.
