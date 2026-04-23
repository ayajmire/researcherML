# ResearcherML - No-Code ML for Healthcare Researchers

> Train publication-ready machine learning models on your medical data. No coding required.

## 🎯 What is ResearcherML?

ResearcherML is a desktop application that allows healthcare researchers to:
- Upload messy medical datasets (CSV, JSON, Excel)
- Clean data through conversational questions
- Train 20+ ML models automatically
- Download trained models for research

**No Python. No coding. No data science degree required.**

## ✨ Key Features

### 🗣️ Conversational Data Cleaning
Instead of technical dropdowns and jargon, we ask plain-English questions:
- "What does this column represent?"
- "Are there values that look wrong?"
- "What should happen to missing values?"

### 📊 Live Visualizations
Watch your data transform in real-time:
- Histograms and bar charts update as you answer
- Missing value indicators turn green when handled
- Before/after comparisons at every step

### 🤖 Automated ML
- 20+ algorithms (Logistic Regression, Random Forest, XGBoost, Neural Networks, etc.)
- Automatic hyperparameter tuning with Optuna
- Confusion matrices and performance metrics
- Multi-class classification support

### 🔒 Privacy-First
- Runs completely on your computer
- No cloud uploads
- No account required
- HIPAA-friendly (all data stays local)

## 📥 Installation

### macOS
1. Download `ResearcherML.dmg`
2. Open the DMG file
3. Drag ResearcherML to Applications
4. Double-click to launch
   - First time: Right-click → Open (to bypass Gatekeeper)

### Windows
1. Download `ResearcherML Setup.exe`
2. Run the installer
3. Follow the wizard
4. Launch from Start Menu

### Linux
1. Download `ResearcherML.AppImage`
2. Make executable: `chmod +x ResearcherML*.AppImage`
3. Double-click to run

## 🚀 Quick Start

1. **Launch the app** - Double-click ResearcherML
2. **Upload your data** - Drop a CSV file or click to browse
3. **Answer questions** - Follow the guided cleaning flow
4. **Train models** - Select algorithms and click Train
5. **Download results** - Export trained models and metrics

## 🎓 Built for Researchers

### Inspired by Research
This project is informed by UCLA/Zar Lab research (*"A benchmark for large language models in bioinformatics"*) which found:
- GPT-4: 63% accuracy on UCI Heart Disease task
- Proper ML pipeline: 96% accuracy
- **Solution:** Guided interface that generates proper ML pipelines

### Use Cases
- Clinical outcome prediction
- Disease classification
- Risk stratification
- Treatment response prediction
- Biomarker discovery

### Publications
Trained models include:
- Feature importance rankings
- Confusion matrices
- Performance metrics (accuracy, precision, recall, F1)
- Ready for publication supplementary materials

## 🛠️ For Developers

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm

### Setup
```bash
# Clone repository
git clone <your-repo-url>
cd researcherML

# Install dependencies
npm install
cd backend && pip install -r requirements.txt && cd ..

# Run in development mode
npm run dev
```

### Build
```bash
# Build for your platform
npm run build:mac      # macOS
npm run build:win      # Windows
npm run build:linux    # Linux
npm run build:all      # All platforms
```

### Project Structure
```
researcherML/
├── electron/          # Desktop app
├── backend/           # Python FastAPI server
├── frontend/          # HTML/CSS/JavaScript
├── assets/            # Icons
└── docs/              # Documentation
```

## 📚 Documentation

- [Complete Summary](COMPLETE_SUMMARY.md) - Overview of all features
- [Questionnaire Feature](QUESTIONNAIRE_FEATURE_COMPLETE.md) - Detailed docs on cleaning interface
- [Electron Build Guide](ELECTRON_BUILD.md) - Building and distributing
- [Sprint 1 Fixes](SPRINT1_COMPLETE.md) - Bug fixes and improvements

## 🧪 Testing

### Manual Testing
```bash
npm run dev  # Launch in dev mode with DevTools
```

Test with sample medical datasets:
- Upload CSV with mixed data types
- Go through questionnaire flow
- Train multiple models
- Check results

### Automated Testing
```bash
npm test  # Coming soon
```

## 🤝 Contributing

We welcome contributions! Areas of focus:
- UI/UX improvements
- Additional ML algorithms
- Better visualizations
- Documentation
- Bug fixes

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Healthcare researchers for feedback
- Open source ML community (scikit-learn, XGBoost, etc.)

## 📧 Contact

- **Developer:** Aadi Ajmire
- **Issues:** GitHub Issues
- **Feedback:** [your-email]

## 🗺️ Roadmap

### Current Version (1.0.0)
- ✅ Desktop application
- ✅ Questionnaire-driven cleaning
- ✅ 20+ ML algorithms
- ✅ Multi-class classification
- ✅ Session persistence

### Coming Soon (1.1.0)
- [ ] User authentication
- [ ] Cloud sync
- [ ] Auto-updates
- [ ] Imaging models (CNN/ResNet)
- [ ] Time series models (LSTM)

### Future
- [ ] Subscription tiers
- [ ] Collaborative features
- [ ] Model marketplace
- [ ] Mobile app

## 💡 Why ResearcherML?

**The Problem:**
Healthcare researchers have valuable data but lack data science skills. Existing tools are too technical (Python/R) or too limited (AutoML black boxes).

**Our Solution:**
A guided interface that teaches while it works. Researchers answer questions about their data, and we generate proper ML pipelines behind the scenes.

**The Impact:**
- Hours instead of weeks
- No coding required
- Publication-ready results
- Proper ML best practices
- Complete transparency

---

**Status:** ✅ MVP Complete - Ready for Beta Testing

**Star this repo if ResearcherML helps your research!** ⭐
