import React from 'react'
import Header from '../components/Header'
import Modal from '../components/Modal'
import RESDownload from '../components/Modal'
import { useState } from 'react'
import Download from '../components/Download'

const Trifasico = () => {
  const [data, setData] = useState([]);
  const [RESVisible, setRESVisible] = useState(false);
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
  const handleDataFileUpload = e => {
    setData(e.target.files);
  }
  const handleResDownload = () => {
    //stackData(data);
    setRESVisible(true);
  }
  const handleDownload = () => {
    console.log('Clicked Download')
  }
  return (
    <>
      <Header />
      <main>
        {RESVisible && <Modal hideComponent={hideRES}>
          <RESDownload data={data} />
        </Modal>}
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
        <Download enable={data.length > 0} handleClick={handleDownload} />
      </main>
    </>

  )
}

export default Trifasico