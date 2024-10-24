import { useEffect } from 'react';
import SequencesToGif from './SequencesToAnimated';
import { initGA, logPageView } from './utils/analytics';
import Footer from './Footer';
import SequencesToGIF from './SequencesToGIF';

const MEASUREMENT_ID = 'G-281ZPF08QH'; // Replace with your actual Measurement ID

const App: React.FC = () => {
  useEffect(() => {
    initGA(MEASUREMENT_ID);
    logPageView();
  }, []);

  return (
    <>
      <SequencesToGIF />
      <Footer />
    </>
  );
};

export default App;
