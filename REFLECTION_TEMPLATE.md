# Reflection: AI-assisted Application Layer Dashboard

Replace the bracketed text with your own words and examples. Aim for 1-2 pages after completing it.

## AI platform and model

I used [platform] and [model]. I chose it because [reason]. I used it to plan the architecture, draft the interface, generate the simulated flows, and help test the interactions. I retained [screenshots/chat export/artifacts] as evidence of this assistance.

## How the two panels stay synchronized

When a user starts an activity, the application creates that activity's ordered list of protocol messages. The activity panel immediately updates its status and log. At the same time, the visualization panel progressively reveals each message from the same list. The player controls change the current position in this sequence, so the user can pause, move forward or backward, and replay without the two panels becoming inconsistent.

## What I checked or corrected

Initially, I reviewed the generated protocol details rather than accepting them without checking. [Describe one real check or correction you made. For example: I confirmed that SMTP is an application-layer conversation and that the message body follows DATA, ending with a line containing only a period.]

## Differences between the flows

Browsing first uses DNS to translate a host name into an IP address and then uses HTTP to request a resource and receive a response. Mail uses DNS differently when looking up an MX record, then SMTP sends a command-and-reply conversation to transfer the email. Streaming fetches a playlist or manifest over HTTP and then repeatedly requests short media segments; unlike a single web page request, it continues fetching segments as playback progresses.

## What I learned

[Write 1-2 paragraphs in your own words about how a visible user action maps to protocol messages and what you learned from using AI responsibly.]
