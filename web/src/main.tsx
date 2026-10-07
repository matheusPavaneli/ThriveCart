import '@fontsource-variable/instrument-sans/wdth.css';
import './styles.css';
import { LazyMotion, MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const loadMotionFeatures = () => import('./motionFeatures').then((module) => module.default);

const root = document.getElementById('root');
if (!root) throw new Error('index.html is missing the #root element.');

createRoot(root).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <App />
      </LazyMotion>
    </MotionConfig>
  </StrictMode>,
);
