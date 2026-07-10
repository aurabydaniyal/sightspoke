import React from 'react';
import {GridScan} from './GridScan';

const GridScanBackground = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen w-full overflow-hidden bg-[#000000] ${className}`}>
      <div className="absolute inset-0 z-0">
        <GridScan
          sensitivity={0.8}
          lineThickness={1.2}
          linesColor="#428475"
          gridScale={0.08}
          scanColor="#89D7B7"
          scanOpacity={0.35}
          enablePost={true}
          bloomIntensity={0.3}
          chromaticAberration={0.001}
          noiseIntensity={0.005}
          lineJitter={0.15}
          scanGlow={0.6}
          scanSoftness={2.5}
          enableWebcam={false}
          showPreview={false}
          scanDuration={2.0}
          scanDelay={2.0}
          scanDirection="pingpong"
          snapBackDelay={300}
          scanOnClick={true}
        />
      </div>
      
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default GridScanBackground;