import React from 'react'
import Header from '../components/Header'
import Dropbox from '../components/Dropbox'
import Download from '../components/Download'
import RESDownload from '../components/RESDownload'
import Modal from '../components/Modal'
import OutputScreen from '../components/OutputScreen'
import Tooltip from '../components/Tooltip'
import { useState } from 'react'
import { processTriData, printWorkbook } from '../assets/processing'


const Trifasico = () => {
    const [data, setData] = useState([]);
    const [processTrigger, setProcessTrigger] = useState(false);
    const [workbook, setWorkbook] = useState(false);
    const [warnings, setWarnings] = useState([]);
    const [penalty, setPenalty] = useState('calculando...');
    const [errs, setErrs] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [ready, setReady] = useState(false);
    const [RESVisible, setRESVisible] = useState(false);

    const handleDataFileUpload = e => {
        setData(e.target.files);
    }
    const handleResDownload = () => {
        setRESVisible(true);
    }
    const handleDataDrop = e => {
        e.preventDefault();
        setData(e.dataTransfer.files);
    }
    const hideRES = e => {
        e.stopPropagation();
        setRESVisible(false)
    }
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
    const resetProcess = () => {
        setReady(false);
        setPenalty('calculando...');
        setWarnings([]);
        setErrs(false);
        setWorkbook(false);
    }

    const startProcessing = () => {
        resetProcess();
        const output = processTriData(data);
        output.then(r => {
            console.log(r);
            const { output, totalPenalty, warnings } = r;
            setWorkbook(output);
            setReady(true);
            setPenalty(`AR$ ${Math.round(totalPenalty * 100) / 100}`);
            setWarnings(warnings);
        }).catch(e => {
            setErrs(e)
        })
        setIsVisible(true);
    }


    return (
        <body>
            <Header />
            <main>
                {/*  {RESVisible && <Modal hideComponent={hideRES}>
                    <RESDownload data={data} />
                </Modal>} */}
                <div className='main-title-container'>
                    <Tooltip />
                    <h1>Calidad de Producto Técnico</h1>
                </div>
                <section className='flexV centerY'>
                    <Dropbox
                        icon={false}
                        title='Data'
                        handleDrop={handleDataDrop}
                        type={true}
                        res={false}
                        handleFileUpload={handleDataFileUpload}
                        handleDelete={() => setData([])}
                        handleResDownload={handleResDownload}
                        fil={data}
                    />
                    <Download enable={data.length > 0} handleClick={startProcessing} />
                </section>
            </main>
            {isVisible &&
                <OutputScreen
                    handleDownload={handleDownload}
                    hideComponent={hideComponent}
                    warnings={warnings}
                    penalty={penalty}
                    fail={errs}
                    ready={ready}
                />}
        </body>
    )
}

export default Trifasico