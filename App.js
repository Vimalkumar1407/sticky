import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [uploadStatus, setUploadStatus] = useState('');
  const [step, setStep] = useState(1);
  const [jobDescription, setJobDescription] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [skills, setSkills] = useState('');
  const [results, setResults] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    // Cleanup function to be called when component unmounts or before page refresh
    const cleanup = async () => {
      try {
        await fetch('http://127.0.0.1:5000/cleanup', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    };

    // Add event listener for beforeunload
    window.addEventListener('beforeunload', cleanup);

    // Cleanup function to be called when component unmounts
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, []);

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setUploadStatus('Uploading resumes...');
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('resume_files[]', files[i]);
      }
      try {
        const response = await fetch('http://127.0.0.1:5000/upload_resumes', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        const data = await response.json();
        setUploadedFiles(data.files);
        setUploadStatus('Resumes uploaded successfully');
        setStep(2);
      } catch (error) {
        console.error('Error:', error);
        setUploadStatus('Error uploading resumes');
      }
    }
  };

  const handleNext = () => {
    if (step === 2) {
      setStep(3);
    }
  };

  const handleScan = async () => {
    setUploadStatus('Scanning...');
    try {
      const response = await fetch('http://localhost:5000/match_resumes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: jobDescription,
          job_role: jobRole,
          selected_skills: skills.split(',').map(skill => skill.trim()),
        }),
      });
      const data = await response.json();
      setResults(data.results);
      setStep(4);
    } catch (error) {
      console.error('Error:', error);
      setUploadStatus('Error scanning resumes');
    }
  };

  const handleResumeClick = async (resumeName) => {
    try {
      const response = await fetch(`http://localhost:5000/get_resume/${resumeName}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error:', error);
      alert('Error opening resume');
    }
  };

  return (
    <div className="App">
      <div className="container">
        {/* Step Indicators */}
        <div className="step-container">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className={`line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2</div>
          <div className={`line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3</div>
          <div className={`line ${step >= 4 ? 'active' : ''}`}></div>
          <div className={`step ${step >= 4 ? 'active' : ''}`}>4</div>
        </div>

        {/* Step 1: Upload Resume */}
        {step === 1 && (
          <div className="upload-box">
            <h2>Upload your resumes to get started</h2>
            <input
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-upload"
              multiple
            />
            <label htmlFor="file-upload" className="upload-button">
              Upload your resumes
            </label>
            {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
          </div>
        )}

        {/* Step 2: Add Job */}
        {step === 2 && (
          <div className="job-description-container">
            <div className="job-description">
              <h2>Enter Job Description</h2>
              <textarea
                rows="6"
                cols="50"
                placeholder="Enter job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <div className="job-title-selector">
              <h2>Enter Job Role</h2>
              <input
                type="text"
                placeholder="Enter job role"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
            </div>
            <button onClick={handleNext} className="next-button">Next</button>
          </div>
        )}

        {/* Step 3: Add Skill Set */}
        {step === 3 && (
          <div className="skillset-container">
            <h2>Add Required Skills</h2>
            <textarea
              rows="10"
              cols="50"
              placeholder="Enter required skills (comma-separated)..."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <button onClick={handleScan} className="scan-button">Scan</button>
          </div>
        )}

        {/* Step 4: View Results */}
        {step === 4 && (
          <div className="results-container">
            <h2>Top 10 Matching Resumes</h2>
            <ul>
              {results.map((result, index) => (
                <li key={index} onClick={() => handleResumeClick(result.resume_name)}>
                  {result.resume_name} (Score: {result.similarity_score})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;