import React from 'react'
import Header from '../components/Header'
import Dropbox from '../components/Dropbox'
import Download from '../components/Download'
import RESDownload from '../components/RESDownload'
import Modal from '../components/Modal'
import Tooltip from '../components/Tooltip'
import { useState } from 'react'
import { processTriData, printWorkbook } from '../assets/processing'


const Trifasico = () => {
    const [data, setData] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const [workbook, setWorkbook] = useState(false);
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
    const startProcessing = () => {
        console.log(data.length);
        const output = processTriData(data);
        output.then(r => {
            printWorkbook(r.output);
        }).catch(e => {
            console.log(e)
        })
    }



    return (
        <>
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
        </>
    )
}

export default Trifasico