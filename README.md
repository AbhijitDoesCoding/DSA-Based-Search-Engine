# DSA Search Engine

A high-performance, glassmorphism-themed search engine for Data Structures and Algorithms (DSA) problems. Instantly search and filter over 14,000+ problems across multiple competitive programming platforms.

## ✨ Features
- **Fast Search:** Indexed with TF-IDF and ranked using Cosine Similarity for high relevance.
- **Multi-Platform:** Search problems from **Codeforces**, **LeetCode**, **AtCoder**, and **CSES**.
- **Glassmorphism UI:** Modern, frosted-glass interface with optimized dark and light modes.
- **Smart Filtering:** Dynamic platform filtering and sorting (relevance, title).
- **History Tracking:** Quick access to your recent searches.
- **Performance Optimized:** Paginated results for smooth browsing of large result sets.

## 🛠️ Tech Stack
- **Backend:** Node.js, Express
- **Search Logic:** TF-IDF (Natural library), Cosine Similarity
- **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript
- **Styling:** Custom CSS with CSS Variables, Backdrop Blurs, and Adaptive Gradients

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Prepare Data (Optional)
If you have new problem sets, place them in `problem-set/` and run the merge utility:
```bash
node utils/merge.js
```

### 3. Run the Server
```bash
node index.js
```
The server will start at `http://localhost:3000`. It will build the search index on startup (this may take a few seconds).

## 📄 Data Sources
- **Codeforces**: 9000+ problems
- **LeetCode**: 3000+ problems
- **AtCoder**: 1000+ problems
- **CSES**: 300+ problems (Problem Set)

## ⚡ Performance
- **Indexed:** 14,000+ problems
- **Search time:** ~50ms
- **Method:** TF-IDF Vector Search + Cosine Similarity Ranking
