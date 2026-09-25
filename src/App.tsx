import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { StatsBar } from './components/stats/StatsBar';
import { LiveView } from './components/detection/LiveView';
import { ControlsBar } from './components/detection/ControlsBar';
import { InputSelector } from './components/input/InputSelector';
import { AnalyticsPanel } from './components/analytics/AnalyticsPanel';
import { ActivityFeed } from './components/feed/ActivityFeed';
import { SettingsModal } from './components/modals/SettingsModal';
import { SnapshotModal } from './components/modals/SnapshotModal';
import { useTrafficEngine } from './hooks/useTrafficEngine';

export function App() {
  const {
    counts,
    recentEvents,
    systemStatus,
    inputMode,
    setInputMode,
    fps,
    lineFlashed,
    modelConfig,
    setModelConfig,
    timeSeries,
    uploadedFile,
    uploadProgress,
    annotatedImageB64,
    tracksRef,
    startDetection,
    pauseDetection,
    stopDetection,
    resetCounters,
    setCountingLineY,
    setConfidenceThreshold,
    toggleBoundingBoxes,
    toggleTrackIds,
    toggleTrajectories,
    handleFileUpload,
    sendWebcamFrame,
    exportCsv,
  } = useTrafficEngine();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Header
        systemStatus={systemStatus}
        inputMode={inputMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onTakeSnapshot={() => setIsSnapshotOpen(true)}
      />

      {/* Main Dashboard Canvas */}
      <main className="dashboard-main">
        {/* Animated Real-Time Statistics Cards */}
        <StatsBar counts={counts} />

        {/* Core Layout: Live Detection Viewport & Controls (Left) vs Input & Activity Feed (Right) */}
        <div className="dashboard-grid-core">
          {/* Left Column: Dominant Live Viewport & Controls */}
          <div className="viewport-column">
            <LiveView
              tracksRef={tracksRef}
              modelConfig={modelConfig}
              lineFlashed={lineFlashed}
              onLinePositionChange={setCountingLineY}
              systemStatus={systemStatus}
              inputMode={inputMode}
              fps={fps}
              uploadedFile={uploadedFile}
              uploadProgress={uploadProgress}
              annotatedImageB64={annotatedImageB64}
              onToggleBoxes={toggleBoundingBoxes}
              onToggleTrails={toggleTrajectories}
              onSendWebcamFrame={sendWebcamFrame}
            />

            {/* Detection Controls Panel */}
            <ControlsBar
              systemStatus={systemStatus}
              modelConfig={modelConfig}
              fps={fps}
              onStart={startDetection}
              onPause={pauseDetection}
              onStop={stopDetection}
              onReset={resetCounters}
              onConfidenceChange={setConfidenceThreshold}
              onLineChange={setCountingLineY}
              onToggleTracking={toggleTrackIds}
              onExportCsv={exportCsv}
            />
          </div>

          {/* Right Column: Input Source Selector & Live Activity Feed */}
          <div className="side-column">
            <InputSelector
              inputMode={inputMode}
              onSelectMode={setInputMode}
              onFileUpload={handleFileUpload}
              uploadedFile={uploadedFile}
              uploadProgress={uploadProgress}
            />

            <ActivityFeed events={recentEvents} />
          </div>
        </div>

        {/* Full-Width Analytics Section */}
        <AnalyticsPanel
          timeSeries={timeSeries}
          counts={counts}
        />
      </main>

      {/* Telemetry Footer */}
      <Footer modelConfig={modelConfig} fps={fps} />

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={modelConfig}
        onChangeConfig={setModelConfig}
      />

      <SnapshotModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
        counts={counts}
        modelConfig={modelConfig}
      />
    </div>
  );
}

export default App;
