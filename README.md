# Application & Transport Layer Protocol Visualizer

**Live Demo:** [View Dashboard on Vercel](https://application-layer-dashboard.vercel.app/)

## 📖 Overview
This project is an interactive, dual-panel web dashboard designed to simulate and visualize network protocol behavior. It extends an Application-layer dashboard by introducing synchronized **Transport-layer visualizations**. 

Users can trigger real-world actions (Browsing the Web, Streaming a Video, Sending an Email) and watch how the data is handled by underlying protocols like **TCP, UDP, and QUIC**.

## ✨ Features
* **Synchronized Dual-Views:** Instantly toggle between Application Layer (HTTP, SMTP, DNS) and Transport Layer (TCP, UDP, QUIC) views representing the exact same moment in time.
* **Accurate TCP State Machine:** Visualizes the full lifecycle of a TCP connection, including the 3-way handshake (SYN, SYN-ACK, ACK), data transfer (PSH, ACK), and connection teardown (FIN, ACK).
* **Deep Packet Inspection:** Displays accurate Sequence (Seq) numbers, Acknowledgement (Ack) numbers, Flags, and Packet Sizes.
* **Interactive Playback Engine:** Users can Play, Pause, Step Forward (⏭), Step Backward (⏮), and Replay simulations to study the traffic step-by-step.
* **Congestion Control (Slow Start):** The "Browse Web" simulation features a live visualization of TCP Slow Start, showing the Congestion Window (`cwnd`) doubling from 10 MSS to 20 MSS after a successful ACK.

## 🚀 How to Run (Local Development)
This project is built using pure, vanilla frontend technologies (HTML, CSS, JavaScript). No package managers, backend servers, or build tools are required!

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/codex-india/application-layer-dashboard.git](https://github.com/codex-india/application-layer-dashboard.git)
