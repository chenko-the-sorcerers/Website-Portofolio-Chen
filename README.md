# Marchel Andrian Shevchenko - Personal Portfolio

Welcome to the official repository for my personal portfolio website. This project showcases my skills, experience, and projects in the field of web development and artificial intelligence. It is built with pure HTML, CSS, and JavaScript, demonstrating a strong foundation in core web technologies. The site is designed to be clean, fast, and easily maintainable.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fchenko-the-sorcerers%2FWebsite-Portofolio-Chen)

---

## ✨ Features

- **Pure Vanilla Stack**: No frameworks or libraries are used, ensuring a lightweight and fast-loading experience.
- **Responsive Design**: Fully responsive layout that adapts to various screen sizes, from mobile devices to desktops.
- **Dynamic Content**: Page content is loaded from local JSON files, making it easy to update information without touching the HTML structure.
- **Clean URL Structure**: Uses a page-based routing system with `vercel.json` to provide clean, user-friendly URLs (e.g., `/projects/` instead of `/projects.html`).
    - **AI Lab Section**: A dedicated section to explore and demonstrate various AI and Machine Learning concepts with interactive examples, featuring interactive modules and explanations.

---

## 🧠 AI Lab Modules

The AI Lab is a dynamic section of the portfolio dedicated to showcasing interactive demonstrations and explanations of various Artificial Intelligence and Machine Learning concepts. Each module provides insights into fundamental algorithms and techniques.

| Module | Description |
| :--- | :--- |
| [AI Lab Home](pages/ai-lab/index.html) | Overview and introduction to the AI Lab. |
| [Bag of Words (BoW)](pages/ai-lab/bow.html) | Explores the Bag of Words model for text representation in NLP. |
| [CNN Architecture](pages/ai-lab/cnn-arch.html) | Delves into the architecture of Convolutional Neural Networks. |
| [CNN Architecture Builder](pages/ai-lab/cnn-arch-builder.html) | An interactive tool to build and visualize CNN architectures. |
| [CNN Fully Connected Layers](pages/ai-lab/cnn-fc.html) | Focuses on the role of fully connected layers in CNNs. |
| [CNN Hands-on](pages/ai-lab/cnn-hands.html) | Practical exercises and demonstrations of CNNs. |
| [CNN Introduction](pages/ai-lab/cnn-intro.html) | An introductory guide to Convolutional Neural Networks. |
| [CNN ReLU Activation](pages/ai-lab/cnn-relu.html) | Explains the Rectified Linear Unit (ReLU) activation function in CNNs. |
| [CNN Why?](pages/ai-lab/cnn-why.html) | Discusses the advantages and applications of CNNs. |
| [Computer Vision](pages/ai-lab/computer-vision.html) | An overview of Computer Vision concepts and applications. |
| [Filtering Kernels](pages/ai-lab/filtering-kernels.html) | Demonstrates the use of filtering kernels in image processing. |
| [Generative AI](pages/ai-lab/generative-ai.html) | Introduction to Generative Artificial Intelligence models. |
| [Image Processing with OpenCV](pages/ai-lab/image-processing-opencv.html) | Practical examples of image processing using OpenCV. |
| [Machine Learning](pages/ai-lab/machine-learning.html) | General introduction to Machine Learning principles. |
| [ML Hypothesis](pages/ai-lab/ml-hypothesis.html) | Explores the concept of hypothesis in Machine Learning. |
| [ML Introduction](pages/ai-lab/ml-intro.html) | Basic introduction to Machine Learning. |
| [Natural Language Processing (NLP)](pages/ai-lab/nlp.html) | Overview of Natural Language Processing techniques. |
| [Pixel Anatomy](pages/ai-lab/pixel-anatomy.html) | Understanding the fundamental structure of digital images. |
| [POS Tagging & NER](pages/ai-lab/pos-ner.html) | Explains Part-of-Speech Tagging and Named Entity Recognition in NLP. |
| [Preprocessing](pages/ai-lab/preprocessing.html) | Discusses data preprocessing techniques in ML. |
| [Tokenization](pages/ai-lab/tokenization.html) | Details the process of tokenization in NLP. |

---

## 🚀 Getting Started
- **Serverless Ready**: The structure includes an `/api` directory, ready for backend functionality using Vercel or Netlify serverless functions.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Deployment**: Vercel
- **Development**: Visual Studio Code, Git & GitHub

---

## 📁 Project Structure

The project follows a clear and organized structure based on the principles of **Separation of Concerns** and **Don't Repeat Yourself (DRY)**.

```
/home/ubuntu/repo/
│
├── 📄 index.html              # Main landing page
├── 📁 pages/                  # All other pages (About, Projects, etc.)
├── 📁 css/                    # Stylesheets (shared and page-specific)
├── 📁 js/                     # JavaScript files (shared and page-specific)
├── 📁 assets/                 # Static files (images, icons, documents)
├── 📁 data/                   # JSON files for dynamic page content
├── 📁 components/             # Reusable HTML snippets (nav, footer)
├── 📁 api/                    # Serverless functions (e.g., for contact form)
├── 📄 vercel.json             # Vercel deployment configuration
└── 📄 README.md               # This file
```

### Key Directories

| Directory | Description |
| :--- | :--- |
| `pages/` | Contains the individual pages of the website, each in its own sub-directory for clean routing. |
| `css/` | Holds all CSS files. `shared.css` contains styles used across all pages, while page-specific styles are in their own files (e.g., `projects.css`). |
| `js/` | Contains all JavaScript files. `shared.js` handles logic for common elements like the navigation and cursor, while page-specific scripts manage dynamic content loading. |
| `data/` | Stores website content in JSON format. This allows for easy updates to projects, experiences, and skills without modifying the HTML. |
| `api/` | Prepared for serverless functions. For example, `api/contact.js` could handle form submissions. |

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need a modern web browser and a local web server to handle the routing correctly.

### Installation & Running Locally

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/chenko-the-sorcerers/Website-Portofolio-Chen.git
    ```

2.  **Navigate to the project directory:**
    ```sh
    cd Website-Portofolio-Chen
    ```

3.  **Start a local server.**
    A simple way is to use the `serve` package.
    ```sh
    # Install serve globally if you haven't already
    npm install -g serve

    # Run the server with the custom config
    serve -c serve.json
    ```
    This will start a server, and you can view the site at `http://localhost:3000`.

---

## ⚙️ Deployment

This project is optimized for deployment on **Vercel**. The `vercel.json` file in the root directory contains all the necessary configuration, including rewrite rules for clean URLs.

To deploy your own version:

1.  Fork this repository.
2.  Click the "Deploy with Vercel" button at the top of this README.
3.  Follow the on-screen instructions to link your GitHub account and deploy the project.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/chenko-the-sorcerers/Website-Portofolio-Chen/issues).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

*This README was generated with the assistance of Manus AI.*
