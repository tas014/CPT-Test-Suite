import React from 'react'
import Header from '../components/Header'
import Dropbox from '../components/Dropbox'
import Download from '../components/Download'
import RESDownload from '../components/RESDownload'
import Modal from '../components/Modal'
import { useState } from 'react'


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
        console.log('processing')
    }



    return (
        <>
            <Header />
            <main>
                {RESVisible && <Modal hideComponent={hideRES}>
                    <RESDownload data={data} />
                </Modal>}
                <h1>Trifasico</h1>
                <Dropbox
                    icon={false}
                    title='Data'
                    handleDrop={handleDataDrop}
                    type={true}
                    handleFileUpload={handleDataFileUpload}
                    handleDelete={() => setData([])}
                    handleResDownload={handleResDownload}
                    fil={data}
                />
                <Download enable={data.length > 0} handleClick={startProcessing} />
            </main>
        </>
    )
}

export default Trifasico