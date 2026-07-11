# 👁️ SightSpoke

### AI-Powered Psychological Survey Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Hugging Face](https://img.shields.io/badge/Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co/)
[![Groq](https://img.shields.io/badge/Groq-FF6B00?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com/)

---

## 📋 Overview

**SightSpoke** is an **enterprise-grade, AI-powered psychological survey platform** that transforms how organizations understand human behavior through visual decision-making analysis. It combines the power of Large Language Models, AI image generation, and clinical psychology principles to deliver professional-grade survey insights.

The platform captures:
- 🎯 **What** users choose (with psychological context)
- ⏱️ **How quickly** they choose (decision latency analysis)
- 🔄 **How consistently** they choose (behavioral pattern recognition)
- 🧠 **Psychological insights** through AI-powered analysis

**Think of it as:** A clinical psychologist + survey expert + AI analyst working together to understand human behavior through visual choices.

---

## ✨ Key Features

### 🤖 AI-Powered Survey Generation
- **Intelligent Quiz Creation**: Generate complete psychological surveys from a simple topic and description
- **AI Image Generation**: Create realistic, contextually-relevant images using Stable Diffusion (via Hugging Face)
- **Psychological Context**: Every image comes with psychological descriptions, concepts, and analysis context
- **Diverse Perspectives**: Each survey page presents two DIFFERENT scenarios of the same psychological concept
- **3-6 Pages**: Flexible survey length with 2 images per page

### 🧠 Expert-Level Analysis
- **Clinical Psychologist Mode**: AI analyzes responses like a senior clinical psychologist
- **Professional Survey Reports**: Structured outputs with Executive Summary, Key Findings, Behavioral Patterns, Implications, and Recommendations
- **Individual Participant Reports**: Concise, actionable summaries for each participant
- **Key Findings Extraction**: Bullet-point insights for quick decision-making
- **Combined Chat Analysis**: AI analyzes all participant conversations for deeper insights

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Beautiful, modern interface with glass effects
- **Animated Backgrounds**: Lightfall and GridScan dynamic backgrounds
- **3D Tilted Cards**: Interactive card design for quiz entry and completion
- **Mobile-First**: Fully responsive across all devices
- **Dark Mode**: Optimized dark theme with accent colors

### 🔐 Privacy First
- No email requirement or tracking scripts
- No personal data collection
- Anonymous participant experience
- Self-hosted deployment ready
- JWT-based authentication with SHA256 hashing

### 🛠️ Complete Admin Dashboard
- **Quiz Management**: Create, edit, delete quizzes with AI generation
- **Image Management**: Upload with titles and descriptions, click to view details
- **Token Generation**: Create anonymous participant links with expiry
- **Response Export**: Export data as JSON, CSV, or professional PDF reports
- **AI Insights**: Real-time psychological analysis with key findings
- **Participant Chat**: Individual participant analysis with chat history
- **Expert Query**: Ask AI questions like a clinical psychologist
- **Settings**: Full data management with stats, cleanup, and password update

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Tailwind CSS, Framer Motion | Modern UI with animations |
| **Backend** | FastAPI, SQLAlchemy, Pydantic | High-performance API with validation |
| **Database** | PostgreSQL 17 | Reliable data storage |
| **AI/LLM** | Groq (Llama 3.3 70B) | Natural language processing & analysis |
| **Image Generation** | Hugging Face (FLUX.1-schnell) | Realistic AI image generation |
| **Authentication** | JWT + SHA256 | Secure admin access |
| **Styling** | Tailwind CSS + Glassmorphism | Modern, professional UI |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.12+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 17+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### API Keys Required

| Service | Purpose | Sign Up |
|---------|---------|---------|
| **Groq** | AI analysis & chat | [console.groq.com](https://console.groq.com) |
| **Hugging Face** | AI image generation | [huggingface.co](https://huggingface.co) |
| **Pexels** | Fallback images (optional) | [pexels.com](https://www.pexels.com) |

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/aurabydaniyal/sightspoke.git
cd sightspoke