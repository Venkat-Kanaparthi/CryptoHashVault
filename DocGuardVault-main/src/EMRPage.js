import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import contractJson from "./BlockVault.json";
import LocationCapture from "./LocationCapture";
import "./App.css";

const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
const contractABI = contractJson.abi;

const shorten = (addr) =>
  addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
const formatDate = (ts) => (ts ? new Date(ts * 1000).toLocaleString() : "");

function EMRPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifyInfo, setVerifyInfo] = useState(null);
  const [auditTrail, setAuditTrail] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  
  // Location-related state
  const [uploadLocation, setUploadLocation] = useState(null);
  const [hasLocationLock, setHasLocationLock] = useState(false);
  const [locationRadius, setLocationRadius] = useState(100);
  const [verifyLocation, setVerifyLocation] = useState(null);

  // Search state for audit trail
  const [searchTerm, setSearchTerm] = useState("");

  // --- Fetch audit trail ---
  const loadAuditTrail = async () => {
    setAuditTrail([]);
    setAuditLoading(true);
    setAuditError("");
    try {
      const resp = await fetch("http://localhost:5000/auditTrail");
      const text = await resp.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response:\n" + text);
      }
      if (json.status === "success") setAuditTrail(json.data);
      else setAuditError(json.error || "Unknown error loading audit.");
    } catch (e) {
      setAuditError("Error fetching audit trail: " + e.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const switchTab = (next) => {
    setTab(next);
    if (next === "audit") loadAuditTrail();
  };

  async function connectWallet() {
    if (!window.ethereum) return setUploadStatus("MetaMask not detected.");
    setUploadStatus("Connecting to MetaMask...");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(accounts[0]);
      setUploadStatus("Wallet connected: " + accounts[0]);
    } catch {
      setUploadStatus("User denied wallet connection.");
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus("");
      setTxHash("");
      // Reset location when file changes
      setUploadLocation(null);
      setHasLocationLock(false);
    }
  };

  const handleVerifyChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setVerifyFile(e.target.files[0]);
      setVerifyStatus("");
      setVerifyInfo(null);
      setVerifyLocation(null);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setUploadStatus("");
    setTxHash("");
    setUploadLocation(null);
    setHasLocationLock(false);
  };

  const clearVerifyFile = () => {
    setVerifyFile(null);
    setVerifyStatus("");
    setVerifyInfo(null);
    setVerifyLocation(null);
  };

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) return setUploadStatus("Please select a file.");
    if (!wallet) return setUploadStatus("Connect your wallet first!");

    setUploadStatus("Hashing file...");
    const buffer = await selectedFile.arrayBuffer();
    const hash = ethers.keccak256(new Uint8Array(buffer));
    setUploadStatus("File hash: " + hash);

    setUploadStatus("Requesting signature in MetaMask...");
    let signature;
    try {
      signature = await window.ethereum.request({
        method: "personal_sign",
        params: [hash, wallet],
      });
    } catch {
      setUploadStatus("Signature denied.");
      return;
    }

    setUploadStatus("Uploading to server...");
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("walletAddress", wallet);
    formData.append("signature", signature);
    formData.append("fileHash", hash); // Send the file hash
    formData.append("hasLocationLock", hasLocationLock.toString());
    if (uploadLocation) {
      formData.append("latitude", uploadLocation.latitude.toString());
      formData.append("longitude", uploadLocation.longitude.toString());
      formData.append("radius", locationRadius.toString());
    }

    try {
      const resp = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response:\n" + text);
      }
      if (data.status === "success") {
        setUploadStatus("Upload successful! Tx hash: " + data.txHash);
        setTxHash(data.txHash);
      } else {
        setUploadStatus("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      setUploadStatus("Network/server error: " + err.message);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    if (!verifyFile) return setVerifyStatus("Choose a file to verify.");

    setVerifyStatus("Hashing file...");
    const buffer = await verifyFile.arrayBuffer();
    const hash = ethers.keccak256(new Uint8Array(buffer));
    setVerifyStatus("Searching blockchain records...");

    try {
      const resp = await fetch(`http://localhost:5000/getFile/${hash}`);
      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server returned non-JSON response:\n" + text);
      }

      if (!data || !data.uploader || data.uploader === "0x0000000000000000000000000000000000000000") {
        setVerifyStatus("File tampered!");
        setVerifyInfo(null);
        return;
      }

      // Check if file has location lock
      if (data.hasLocationLock) {
        setVerifyStatus("File has location lock. Capturing your location...");
        
        // Get user's current location
        if (!navigator.geolocation) {
          setVerifyStatus("Location verification failed: Geolocation not supported");
          setVerifyInfo(null);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const userLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setVerifyLocation(userLocation);

            // Verify location with backend
            try {
              const locationResp = await fetch("http://localhost:5000/verifyLocation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fileHash: hash,
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude
                })
              });

              const locationData = await locationResp.json();
              
              if (locationData.isValidLocation) {
                setVerifyStatus("File found and location verified!");
                setVerifyInfo({ ...data, hash, locationVerified: true, userLocation });
              } else {
                setVerifyStatus("File found but location verification failed!");
                setVerifyInfo({ ...data, hash, locationVerified: false, userLocation });
              }
            } catch (locationErr) {
              setVerifyStatus("File found but location verification failed: " + locationErr.message);
              setVerifyInfo({ ...data, hash, locationVerified: false, userLocation });
            }
          },
          (error) => {
            setVerifyStatus("File found but location access denied. Cannot verify location lock.");
            setVerifyInfo({ ...data, hash, locationVerified: false });
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setVerifyStatus("File found!");
        setVerifyInfo({ ...data, hash, locationVerified: null });
      }
    } catch (err) {
      setVerifyStatus("Verification failed: " + err.message);
      setVerifyInfo(null);
    }
  }

  const getStatusClass = (statusText) => {
    if (!statusText) return "";
    const s = statusText.toLowerCase();
    if (s.includes("successful") || s.includes("verified") || s.includes("found!")) {
      return "status success";
    }
    if (s.includes("failed") || s.includes("denied") || s.includes("not found") || s.includes("tampered") || s.includes("error")) {
      return "status error";
    }
    if (s.includes("hashing") || s.includes("searching") || s.includes("uploading") || s.includes("signature") || s.includes("capturing") || s.includes("verifying") || s.includes("connecting")) {
      return "status info";
    }
    return "status warning";
  };

  const filteredAuditTrail = auditTrail.filter(
    (ev) =>
      ev.fileHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.uploader.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app">
      <div className="container">
        
        {/* Navigation Logo & Badges */}
        <div className="header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate("/")}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-headings)', fontSize: '18px', background: 'var(--gradient-glow)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              DocGuard Vault
            </span>
          </div>
          <div className="title-badge" style={{ margin: 0 }}>
            Web3 Console
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-switcher">
          <button className={tab === "upload" ? "tab active" : "tab"} onClick={() => switchTab("upload")}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload File
          </button>
          <button className={tab === "verify" ? "tab active" : "tab"} onClick={() => switchTab("verify")}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Verify Integrity
          </button>
          <button className={tab === "audit" ? "tab active" : "tab"} onClick={() => switchTab("audit")}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Audit Trail
          </button>
        </div>

        {/* --- Upload Tab --- */}
        {tab === "upload" && (
          <div className="panel">
            <form onSubmit={handleUpload} className="stack">
              
              {/* Custom File Upload Dropzone */}
              <div className={`file-upload-zone ${selectedFile ? 'has-file' : ''}`}>
                <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="upload-text">
                  {selectedFile ? (
                    <>Selected file: <strong>{selectedFile.name}</strong></>
                  ) : (
                    <>Drag & drop file here or <strong>browse files</strong></>
                  )}
                </div>
                <input type="file" className="file-upload-input" onChange={handleFileChange} />
              </div>

              {/* Selected file detail indicator */}
              {selectedFile && (
                <div className="selected-file-details">
                  <div className="verify-item">
                    <div className="file-name-meta">{selectedFile.name}</div>
                    <div className="file-size-meta">{(selectedFile.size / 1024).toFixed(2)} KB</div>
                  </div>
                  <button type="button" className="file-remove-btn" onClick={clearSelectedFile}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Location Lock Switch Control */}
              <div className="switch-control-card">
                <div className="switch-label-group">
                  <span className="switch-title">
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    Enable Location Lock
                  </span>
                  <span className="switch-description">Verify this file only from within a locked location radius</span>
                </div>
                <label style={{ display: 'inline-block', position: 'relative' }}>
                  <input
                    type="checkbox"
                    className="switch-toggle-input"
                    id="locationLock"
                    checked={hasLocationLock}
                    onChange={(e) => setHasLocationLock(e.target.checked)}
                    disabled={!selectedFile}
                  />
                  <span className="switch-toggle-slider"></span>
                </label>
              </div>

              {/* Location Capture Widget */}
              {hasLocationLock && (
                <LocationCapture
                  onLocationChange={setUploadLocation}
                  disabled={!selectedFile}
                />
              )}

              {/* Radius Setting Slider */}
              {hasLocationLock && uploadLocation && (
                <div className="slider-control-card">
                  <div className="slider-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                      </svg>
                      Verification Radius
                    </span>
                    <span className="value">{locationRadius} meters</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={locationRadius}
                    onChange={(e) => setLocationRadius(parseInt(e.target.value))}
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="action-btn"
                disabled={!selectedFile || !wallet || (hasLocationLock && !uploadLocation)}
              >
                {uploadStatus.includes("hashing") || uploadStatus.includes("uploading") || uploadStatus.includes("signature") ? (
                  <>
                    <span className="spinner"></span>
                    Processing Request...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                    Upload & Cryptographically Lock
                  </>
                )}
              </button>
            </form>

            {uploadStatus && (
              <div className={getStatusClass(uploadStatus)}>
                <div>{uploadStatus}</div>
                {txHash && (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Transaction on Amoy
                    <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- Verify Tab --- */}
        {tab === "verify" && (
          <div className="panel">
            <form onSubmit={handleVerify} className="stack">
              
              {/* Custom Drag & Drop for Verify */}
              <div className={`file-upload-zone ${verifyFile ? 'has-file' : ''}`}>
                <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <div className="upload-text">
                  {verifyFile ? (
                    <>Selected file: <strong>{verifyFile.name}</strong></>
                  ) : (
                    <>Drag & drop file to verify or <strong>browse files</strong></>
                  )}
                </div>
                <input type="file" className="file-upload-input" onChange={handleVerifyChange} />
              </div>

              {verifyFile && (
                <div className="selected-file-details">
                  <div className="verify-item">
                    <div className="file-name-meta">{verifyFile.name}</div>
                    <div className="file-size-meta">{(verifyFile.size / 1024).toFixed(2)} KB</div>
                  </div>
                  <button type="button" className="file-remove-btn" onClick={clearVerifyFile}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <button type="submit" className="action-btn" disabled={!verifyFile}>
                {verifyStatus.includes("Hashing") || verifyStatus.includes("Searching") || verifyStatus.includes("Location") ? (
                  <>
                    <span className="spinner"></span>
                    Verifying Proofs...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Verify Authenticity & Lock
                  </>
                )}
              </button>
            </form>

            {verifyStatus && (
              <div className={getStatusClass(verifyStatus)}>{verifyStatus}</div>
            )}

            {verifyInfo && (
              <div className="verify-box">
                <div className="verify-box-header">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cryptographic Ledger Proof
                </div>
                <div className="verify-grid">
                  <div className="verify-item">
                    <span className="verify-label">File Keccak Hash</span>
                    <span className="verify-value" style={{ fontFamily: 'monospace', fontSize: '13px' }}>{verifyInfo.hash}</span>
                  </div>
                  <div className="verify-item">
                    <span className="verify-label">Uploader Address</span>
                    <span className="verify-value">
                      <a href={`https://amoy.polygonscan.com/address/${verifyInfo.uploader}`} target="_blank" rel="noopener noreferrer">
                        {shorten(verifyInfo.uploader)}
                      </a>
                    </span>
                  </div>
                  <div className="verify-item">
                    <span className="verify-label">Decentralized IPFS CID</span>
                    <span className="verify-value">
                      <a href={`https://ipfs.io/ipfs/${verifyInfo.ipfsCID}`} target="_blank" rel="noopener noreferrer">
                        {verifyInfo.ipfsCID}
                      </a>
                    </span>
                  </div>
                  <div className="verify-item">
                    <span className="verify-label">Block Timestamp</span>
                    <span className="verify-value">{formatDate(verifyInfo.timestamp)}</span>
                  </div>
                  <div className="verify-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="verify-label">Cryptographic Signature</span>
                    <span className="verify-value" style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      {verifyInfo.signature}
                    </span>
                  </div>
                  
                  {/* Location Security check */}
                  {verifyInfo.hasLocationLock !== undefined && (
                    <div className="verify-location-badge">
                      <div className="verify-location-title">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Location Lock Security Check
                      </div>
                      
                      {verifyInfo.hasLocationLock ? (
                        <>
                          <div className={`verify-location-status ${verifyInfo.locationVerified === true ? 'verified' : 'failed'}`}>
                            {verifyInfo.locationVerified === true ? (
                              <>
                                <span className="status-dot active"></span>
                                Verified Location Match
                              </>
                            ) : (
                              <>
                                <span className="status-dot" style={{ backgroundColor: '#ef4444', boxShadow: '0 0 8px #ef4444' }}></span>
                                Location Verification Failed
                              </>
                            )}
                          </div>
                          
                          <div className="verify-location-details">
                            <div>
                              <span style={{ color: 'var(--color-text-dim)' }}>Verification coordinates:</span>
                              <br />
                              {verifyInfo.userLocation ? `${verifyInfo.userLocation.latitude.toFixed(6)}, ${verifyInfo.userLocation.longitude.toFixed(6)}` : 'Access Denied'}
                            </div>
                            <div>
                              <span style={{ color: 'var(--color-text-dim)' }}>Lock center coordinates:</span>
                              <br />
                              {verifyInfo.latitude && verifyInfo.longitude ? `${verifyInfo.latitude.toFixed(6)}, ${verifyInfo.longitude.toFixed(6)} (±${verifyInfo.radius}m)` : 'N/A'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                          🔓 No location lock is enforced on this record.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- Audit Tab --- */}
        {tab === "audit" && (
          <div className="panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontFamily: 'var(--font-headings)', fontSize: '18px', fontWeight: 700 }}>
                Audit Trail (Blockchain Logs)
              </h3>
              
              {/* Search input */}
              <div className="search-container" style={{ minWidth: '240px' }}>
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by hash or uploader..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {auditLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)', padding: '20px 0' }}>
                <span className="spinner"></span>
                <span>Fetching records from ledger...</span>
              </div>
            )}
            {auditError && <div className="status error">{auditError}</div>}

            {!auditLoading && !auditError && filteredAuditTrail.length === 0 && (
              <div className="status info" style={{ padding: '20px', textAlign: 'center' }}>
                No audit logs match your search.
              </div>
            )}

            {!auditLoading && !auditError && filteredAuditTrail.length > 0 && (
              <ul className="audit-list">
                {filteredAuditTrail.map((ev) => (
                  <li key={ev.fileHash} className="audit-card">
                    <div className="audit-card-row">
                      <span className="audit-card-hash">
                        {ev.fileHash.slice(0, 16)}...{ev.fileHash.slice(-8)}
                      </span>
                      <a
                        href={`https://ipfs.io/ipfs/${ev.ipfsCID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="audit-card-ipfs"
                      >
                        IPFS CID
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                    
                    <div className="audit-card-meta">
                      <div className="audit-meta-item">
                        <svg className="audit-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Uploader: <strong>{shorten(ev.uploader)}</strong></span>
                      </div>
                      <div className="audit-meta-item">
                        <svg className="audit-meta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Logged: <strong>{formatDate(ev.timestamp)}</strong></span>
                      </div>
                      
                      {ev.hasLocationLock && (
                        <div className="audit-meta-item" style={{ gridColumn: '1 / -1', color: '#fbbf24', fontWeight: 600 }}>
                          <svg className="audit-meta-icon" style={{ color: '#fbbf24' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                          </svg>
                          <span>Location Enforced (±{ev.radius}m)</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* --- Wallet footer: always at the end --- */}
        <div className="wallet-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`status-dot ${wallet ? 'active' : ''}`}></span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: wallet ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
              {wallet ? 'MetaMask Connected' : 'Wallet Disconnected'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {wallet && <span className="address-pill">{shorten(wallet)}</span>}
            <button className={`wallet-btn ${wallet ? 'connected' : ''}`} onClick={connectWallet}>
              {wallet ? (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Connected
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Connect MetaMask
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default EMRPage;
