import React, { useState } from 'react';

const LocationCapture = ({ onLocationChange, disabled = false }) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setLocation(newLocation);
        onLocationChange(newLocation);
        setIsLoading(false);
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            break;
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const clearLocation = () => {
    setLocation(null);
    onLocationChange(null);
    setError(null);
  };

  return (
    <div className="slider-control-card" style={{ marginTop: '12px' }}>
      
      {/* Title Header */}
      <div className="slider-header" style={{ marginBottom: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          Location Lock Parameters
        </span>
        {location && (
          <span className="value">
            Captured
          </span>
        )}
      </div>
      
      {/* Location Status State */}
      {location ? (
        <div className="status success" style={{ marginTop: 0, padding: '12px 16px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span className="status-dot active"></span>
            <strong>Location locked successfully</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#a7f3d0', opacity: 0.9 }}>
            Latitude: {location.latitude.toFixed(6)}° | Longitude: {location.longitude.toFixed(6)}°
            <br />
            GPS Accuracy: ±{Math.round(location.accuracy)} meters
          </div>
        </div>
      ) : (
        <div className="status info" style={{ marginTop: 0, padding: '12px 16px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: '#64748b', borderRadius: '50%' }}></span>
            No location coordinates locked yet
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="status error" style={{ marginTop: 0, padding: '12px 16px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={disabled || isLoading}
          className="action-btn"
          style={{
            flex: 2,
            padding: '10px 16px',
            fontSize: '13px',
            borderRadius: '10px',
            background: location 
              ? 'var(--gradient-success)' 
              : 'var(--gradient-primary)',
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '1.5px' }}></span>
              Acquiring GPS...
            </>
          ) : location ? (
            '📍 Recapture Location'
          ) : (
            '📍 Lock GPS Coordinates'
          )}
        </button>

        {location && (
          <button
            type="button"
            onClick={clearLocation}
            disabled={disabled}
            className="action-btn"
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: '13px',
              borderRadius: '10px',
              background: 'var(--gradient-danger)',
            }}
          >
            🗑️ Clear Lock
          </button>
        )}
      </div>

      <div style={{ 
        fontSize: '11px', 
        color: 'var(--color-text-dim)',
        lineHeight: '1.4',
        marginTop: '6px',
        borderTop: '1px solid rgba(255, 255, 255, 0.03)',
        paddingTop: '8px'
      }}>
        <strong>Security Policy:</strong> Enabling location locking requires verifiers to be within the set radius boundary of this location to decrypt/retrieve the files.
      </div>
    </div>
  );
};

export default LocationCapture;
