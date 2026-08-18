import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function BlockchainExplorerPage() {
  const [chain, setChain] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const fetchChain = async () => {
    setLoading(true);
    try {
      const res = await api.get('/blockchain/chain');
      if (res.data.success) {
        setChain(res.data.chain);
      }
    } catch (err) {
      console.error('Failed to fetch chain:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateChain = async () => {
    setValidating(true);
    try {
      const res = await api.get('/blockchain/validate');
      if (res.data.success) {
        setValidationResult(res.data);
      }
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    fetchChain();
  }, []);

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-link-45deg me-2 text-primary"></i>
            Blockchain Ledger Explorer
          </h2>
          <div className="text-muted small">
            MongoDB-Persisted SHA-256 Block-Chained Ledger · Transparent Cryptographic Audit Trail
          </div>
        </div>
        <div className="d-flex gap-2 mt-2 mt-md-0">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchChain} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh Blocks
          </button>
          <button className="btn btn-success btn-sm fw-semibold" onClick={handleValidateChain} disabled={validating}>
            {validating ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                Recalculating Hashes...
              </>
            ) : (
              <>
                <i className="bi bi-shield-check me-1"></i> Validate Chain Integrity
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Result Banner */}
      {validationResult && (
        <div
          className={`alert ${
            validationResult.isValid ? 'alert-success border-success' : 'alert-danger border-danger'
          } shadow-sm mb-4`}
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="alert-heading fw-bold mb-1">
                {validationResult.isValid ? '✅ Cryptographic Blockchain Integrity: 100% VALID' : '🚨 Chain Integrity Violation Detected'}
              </h5>
              <div className="small">
                Recalculated SHA-256 hashes across all <strong>{validationResult.totalBlocks} blocks</strong>. Every block hash and <code>previousHash</code> pointer sequence matches perfectly.
              </div>
            </div>
            <span className="badge bg-white text-dark border p-2">
              Audited at {new Date(validationResult.checkedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* Chain Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">TOTAL BLOCKS MINED</div>
            <div className="fs-3 fw-bold text-primary">{chain.length}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">CONSENSUS ALGORITHM</div>
            <div className="fs-6 fw-bold text-dark mt-1">Proof of Authority (PoA)</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">HASHING FUNCTION</div>
            <div className="fs-6 fw-bold font-monospace text-dark mt-1">SHA-256 (256-bit)</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card border p-3 bg-white">
            <div className="text-muted small fw-bold">DUAL-LAYER STATUS</div>
            <div className="fs-6 fw-bold text-success mt-1">Local Ledger + Testnet Ready</div>
          </div>
        </div>
      </div>

      {/* Block List */}
      <div className="card border shadow-sm">
        <div className="card-header bg-light py-3">
          <h5 className="card-title mb-0 fs-6 fw-bold">
            <i className="bi bi-boxes me-2 text-primary"></i> Block Sequence (Genesis → Tip)
          </h5>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              <div className="small text-muted mt-2">Loading blockchain ledger...</div>
            </div>
          ) : chain.length === 0 ? (
            <div className="text-center py-5 text-muted">No blocks mined yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Index</th>
                    <th>Action</th>
                    <th>Certificate ID</th>
                    <th>Block Hash (SHA-256)</th>
                    <th>Previous Hash</th>
                    <th>Timestamp</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {chain.map((block) => (
                    <tr key={block.index}>
                      <td>
                        <span className="badge bg-primary fs-6">#{block.index}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            block.action === 'GENESIS'
                              ? 'bg-secondary'
                              : block.action.includes('REVOKE')
                              ? 'bg-danger'
                              : 'bg-success'
                          }`}
                        >
                          {block.action}
                        </span>
                      </td>
                      <td className="font-monospace fw-bold">
                        {block.data?.certificateId || <span className="text-muted">N/A (Genesis)</span>}
                      </td>
                      <td className="font-monospace small text-truncate" style={{ maxWidth: '160px' }}>
                        {block.hash}
                      </td>
                      <td className="font-monospace small text-truncate text-muted" style={{ maxWidth: '140px' }}>
                        {block.previousHash}
                      </td>
                      <td className="small text-muted">{new Date(block.timestamp).toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => setSelectedBlock(block)}
                        >
                          <i className="bi bi-eye me-1"></i> Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Block Inspection Modal */}
      {selectedBlock && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-light">
                <h5 className="modal-title fs-6 fw-bold">
                  <i className="bi bi-box-seam me-2 text-primary"></i>
                  Block #{selectedBlock.index} Details
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedBlock(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <span className="small text-muted">Block Hash (SHA-256):</span>
                  <div className="font-monospace small bg-light p-2 rounded text-break border">
                    {selectedBlock.hash}
                  </div>
                </div>

                <div className="mb-3">
                  <span className="small text-muted">Previous Block Hash (Parent Link):</span>
                  <div className="font-monospace small bg-light p-2 rounded text-break border">
                    {selectedBlock.previousHash}
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <span className="small text-muted">Mined Timestamp:</span>
                    <div className="small fw-semibold">
                      {new Date(selectedBlock.timestamp).toUTCString()} ({selectedBlock.timestamp})
                    </div>
                  </div>
                  <div className="col-md-6">
                    <span className="small text-muted">Validator Authority:</span>
                    <div className="small fw-semibold">{selectedBlock.validator}</div>
                  </div>
                </div>

                <div className="mb-2">
                  <span className="small text-muted">Block Payload Data (Immutable):</span>
                  <pre className="bg-dark text-light p-3 rounded small font-monospace mt-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {JSON.stringify(selectedBlock.data, null, 2)}
                  </pre>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedBlock(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
