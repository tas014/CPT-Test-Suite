import Dropbox from '../components/Dropbox';
import Download from '../components/Download';
import { processMonoData, printWorkbook } from '../assets/processing';
import { useState } from 'react';
import useStateWithCallback from 'use-state-with-callback';
import OutputScreen from '../components/OutputScreen';
import Tooltip from '../components/Tooltip';
import '../App.css';
import Modal from '../components/Modal';
import RESDownload from '../components/RESDownload';
import Header from '../components/Header';

function Monofasico() {
  const updateTrigger = () => {
    if (data.length > 0 && energyFile.length > 0) {
      setProcessTrigger(true)
    } else {
      setProcessTrigger(false)
    }
  }
  const [data, setData] = useStateWithCallback([], () => {
    updateTrigger();
  });;
  const [energyFile, setEnergyFile] = useStateWithCallback([], () => {
    updateTrigger();
  });
  const [processTrigger, setProcessTrigger] = useState(false);
  const [workbook, setWorkbook] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [penalty, setPenalty] = useState('calculando...');
  const [errs, setErrs] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [RESVisible, setRESVisible] = useState(false);


  // DROP FUNCTIONS

  const handleDataDrop = e => {
    e.preventDefault();
    setData(e.dataTransfer.files);

    /* FILTER NON .dat FILES
    const outputFiles = {};
    if (e.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      [...e.dataTransfer.items].forEach((item, i) => {
        // If dropped items aren't files, reject them
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (getFileType(file.name) === '.dat') {
            outputFiles[i] = file;
          }
        }
      });
      if (Object.keys(outputFiles).length > 0) {
        console.log('we there', outputFiles)
        setData(outputFiles);
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      [...e.dataTransfer.files].forEach((file, i) => {
        if (getFileType(file.name) === '.dat') {
          outputFiles[i] = file;
        }
      });
      if (Object.keys(outputFiles).length > 0) {
        setData(outputFiles);
      }
    }*/
  }

  const handleEnergyDrop = e => {
    e.preventDefault();
    setEnergyFile(e.dataTransfer.files);

    /* FILTER NON EXCEL VALID FILES
    const outputFile = {};
    if (e.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      [...e.dataTransfer.items].forEach((item, i) => {
        // If dropped items aren't files, reject them
        if (item.kind === "file") {
          const file = item.getAsFile();
          const fileType = getFileType(file.name)
          if ( fileType === '.xlsx' || fileType === '.xls') {
            if (Object.keys(outputFile).length === 0) {
              outputFile[i] = file
            }
          }
        }
      });
      if (Object.keys(outputFile).length > 0) {
        setEnergyFile(outputFile);
      }
    } else {
      // Use DataTransfer interface to access the file(s)
      [...e.dataTransfer.files].forEach((file, i) => {
        const fileType = getFileType(file.name)
        if ( fileType === '.xlsx' || fileType === '.xls') {
          if (Object.keys(outputFile).length === 0) {
            outputFile[i] = file
          }
        }
      });
      if (Object.keys(outputFile).length > 0) {
        setEnergyFile(outputFile);
      }
    } */
  }

  /*const getFileType = fileName => {
    return fileName.slice(fileName.indexOf('.'), fileName.length)
  } */

  // CLICK FUNCTIONS

  const handleDataFileUpload = e => {
    setData(e.target.files);
  }
  const handleEnergyFileUpload = e => {
    setEnergyFile(e.target.files);
  }

  const resetProcess = () => {
    setReady(false);
    setPenalty('calculando...');
    setWarnings([]);
    setErrs(false);
    setWorkbook(false);
  }

  // PROCESSING
  const startProcessing = () => {
    resetProcess();
    if (processTrigger) {
      const output = processMonoData(energyFile, data);
      output.then(res => {
        const { output, warnings } = res;
        setWarnings(warnings);
        output.then(res => {
          const { output, penalty } = res;
          setWorkbook(output);
          setPenalty(`AR$ ${Math.round(penalty * 100) / 100}`);
          setReady(true);
        }).catch(rej => {
          setErrs(`${rej}. Por favor verifique que los archivos proveidos son correctos entre sí.`)
        })
      }).catch(rej => {
        setErrs(`Hubo un problema procesando el archivo de mediciones.`)
      })
      setIsVisible(true);
    }
  }

  const handleResDownload = () => {
    //stackData(data);
    setRESVisible(true);
  }

  const hideRES = e => {
    e.stopPropagation();
    setRESVisible(false)
  }

  // UI CLICKS

  const handleDownload = e => {
    e.stopPropagation();
    if (ready) {
      printWorkbook(workbook)
    }
  }

  const hideComponent = e => {
    e.stopPropagation();
    setWorkbook(false);
    setIsVisible(false);
    setReady(false);
  }

  return (
    <body>
      <Header />
      <main>
        {RESVisible && <Modal hideComponent={hideRES}>
          <RESDownload data={data} />
        </Modal>}
        <div className='main-title-container'>
          <Tooltip />
          <h1>Calidad de Producto Técnico</h1>
        </div>
        <section className='main-screen'>
          <Dropbox
            icon={true}
            title='Energía de Mediciones'
            handleDrop={handleEnergyDrop}
            handleFileUpload={handleEnergyFileUpload}
            handleDelete={() => setEnergyFile([])}
            handleResDownload={handleResDownload}
            type={false}
            fil={energyFile}
          />
          <Dropbox
            icon={false}
            title='Data'
            handleDrop={handleDataDrop}
            type={true}
            res={true}
            handleFileUpload={handleDataFileUpload}
            handleDelete={() => setData([])}
            handleResDownload={handleResDownload}
            fil={data}
          />
          <Download enable={processTrigger} handleClick={startProcessing} />
        </section>
        {isVisible &&
          <OutputScreen
            handleDownload={handleDownload}
            hideComponent={hideComponent}
            warnings={warnings}
            penalty={penalty}
            fail={errs}
            ready={ready}
          />}
      </main>
    </body>
  );
}

export default Monofasico;
