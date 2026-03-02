# DSA Search Engine

A high-performance, industrial-style search engine for Data Structures and Algorithms (DSA) problems. Instantly search and filter over 14,000+ problems across multiple competitive programming platforms with a semantic, relevance-first approach.

## ✨ Features
- **Fast Search:** Indexed with TF-IDF and ranked using Cosine Similarity for high relevance.
- **Multi-Platform:** Search problems from **Codeforces**, **LeetCode**, **AtCoder**, and **CSES**.
- **Developer Tool Aesthetic:** Modern, high-contrast dark theme inspired by professional engineering software.
- **Smart Filtering:** Dynamic platform filtering and sorting (relevance, title).
- **History Tracking:** Quick access to your recent searches.
- **Performance Optimized:** Paginated results for smooth browsing of large result sets (~50ms query time).

## 🛠️ Tech Stack
- **Backend:** Node.js, Express
- **Search Logic:** TF-IDF (Natural library), Cosine Similarity
- **Frontend:** HTML5, CSS3 (Modern Dark), Vanilla JavaScript
- **Styling:** Custom CSS with CSS Variables, Matte Charcoal background, Grid textures, and industrial orange accents.

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

## 🎯 Why TF–IDF?

When you search for “tree,” you’ll get results mentioning “tree” everywhere—even in generic posts. TF–IDF down-weights common words and boosts terms that are important in a particular document but rare across the corpus.

**Example:** In a collection of math problems, “array” appears frequently (low weight), but “quicksort” appears in few documents (high weight).

### 🧮 Term Frequency (TF)
- **Definition:** How often a term appears in a document, normalized by document length.
- **Formula:** `TF(t,d) = (Number of times term t appears in document d) / (Total terms in d)`.
- **Example:** If “binary” appears 3 times in a 100-word problem statement, TF = 3/100 = 0.03.

### 🌍 Inverse Document Frequency (IDF)
- **Definition:** How unique or rare a term is across all documents.
- **Formula:** `IDF(t) = log( (Total number of documents) / (Number of documents containing term t) )`.
- **Example:** In 1,000 problems, if “dfs” appears in 10 of them, IDF = log(1000/10) ≈ 2.

### ✖️ Calculating TF–IDF
- **Formula:** `TF–IDF(t,d) = TF(t,d) × IDF(t)`
- **Interpretation:** A term gets a high TF–IDF if it’s frequent in one document (high TF) but rare in the corpus (high IDF).

## 📚 Resources

### Search Engine Logic
- **TF–IDF on YouTube:** [Watch Tutorial](https://www.youtube.com/watch?v=ATK6fm3cYfI)
- **Medium Tutorial:** [Read Article](https://medium.com/@abhishekjainindore24/tf-idf-in-nlp-term-frequency-inverse-document-frequency-e05b65932f1d)

### Scraping & Data
- **Puppeteer YouTube Tutorial:** [Watch Tutorial](https://www.youtube.com/watch?v=lgyszZhAZOI)
- **Puppeteer Documentation:** [Visit Site](https://pptr.dev/)

## 📄 Data Sources
- **Codeforces**: 9000+ problems
- **LeetCode**: 3000+ problems
- **AtCoder**: 1000+ problems
- **CSES**: 300+ problems (Problem Set)

## 👤 Author / Links
- **Abhijit Balpande**
- **GitHub**: [AbhijitDoesCoding](https://github.com/AbhijitDoesCoding)
- **LinkedIn**: [Abhijit Balpande](https://www.linkedin.com/in/abhijit-balpande/)
- **Repository**: [DSA Search Engine](https://github.com/AbhijitDoesCoding/DSA-Based-Search-Engine.git)
