# Application Layer Activity & Protocol Visualizer

A responsive, static dashboard for the Computer Networks - Application Layer assignment. It uses no external services: all protocol exchanges are accurate, educational simulations that run entirely in the browser.

## Run locally

Open `index.html` in a modern browser. No installation is needed.

## What it demonstrates

- **Browsing:** DNS A-record lookup followed by an HTTP request and response.
- **Mail:** DNS MX lookup followed by an SMTP session: EHLO, capabilities, MAIL FROM, RCPT TO, DATA, acceptance, and QUIT.
- **Streaming:** a real, embedded YouTube video (replaceable with any public YouTube link), plus a DNS lookup, HTTP playlist fetch, and HTTP segment requests/responses simulation.
- A two-panel layout that synchronizes a left-side user activity with an animated, controllable protocol timeline on the right.

## Deploy to get one public link

1. Create a GitHub account and a new repository, for example `application-layer-dashboard`.
2. Upload every file in this folder to that repository (not the parent folder).
3. Sign in to [Vercel](https://vercel.com) with GitHub.
4. Choose **Add New → Project**, select your repository, and click **Deploy**. There is no build setting to change for this static site.
5. Vercel displays a production URL such as `https://application-layer-dashboard.vercel.app`. Save and submit that one link. Future GitHub updates deploy automatically.

## Submission checklist

- Source code: this folder
- Live dashboard: the Vercel production URL
- AI evidence: `AI_USAGE_LOG.md`, plus screenshots of this conversation if your instructor permits
- Demonstration: record the three modes and the matching timeline
- Reflection: complete `REFLECTION_TEMPLATE.md` with your own observations

## Important academic note

The included files are an AI-assisted starting point. Review the protocol text, test every activity, and write the reflection in your own words. Keep a screenshot or export of the prompts/answers used while creating and refining the project.
