import { useEffect } from 'react';
import SequencesToGif from './SequencesToGIF';
import { initGA, logPageView } from './utils/analytics';

const MEASUREMENT_ID = 'G-281ZPF08QH'; // Replace with your actual Measurement ID

const App: React.FC = () => {
  useEffect(() => {
    initGA(MEASUREMENT_ID);
    logPageView();
  }, []);

  return <SequencesToGif />;
};

export default App;
