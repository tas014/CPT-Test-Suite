import React, {useRef} from 'react'
import Filler from './Filler'
import { RiFileExcel2Line } from "react-icons/ri";
import { CiFileOn } from "react-icons/ci";
import { FaTrashAlt } from "react-icons/fa";
import Button from './Button';

const Dropbox = ({icon, title, handleDrop, handleFileUpload, type, fil, handleDelete, handleResDownload}) => {
    const inputDataFile = useRef(null)
    const inputEnergyFile = useRef(null)
    const handleClick = () => {
        if (type) {
            inputDataFile.current.click()
        } else {
            inputEnergyFile.current.click()
        }
    }
    const handleDragOver = (e) => {
        e.preventDefault();
    }
  return (
    <div className='dropboxContainer'>
        <div className='dropbox-title-container'>
            <h2>{icon ? <RiFileExcel2Line color='#107C41' size={35} /> : <CiFileOn size={35} />}{title}</h2>
            <FaTrashAlt size={25} className='delete-files-button' onClick={handleDelete} />
        </div>
        <div onDrop={handleDrop} onDragOver={handleDragOver} onClick={handleClick} className='dropbox'>
            {fil.length > 0 ? (<ul>
                {Object.keys(fil).map((key, ind) => {
                    const filetype = fil[key].name.slice(fil[key].name.indexOf('.'), fil[key].name.length);
                    return <li key={ind}>{filetype === '.dat' ? <CiFileOn className='liIcon' size={25}/> : <RiFileExcel2Line className='liIcon' size={25} color='#107C41' />}{fil[key].name}</li>    
                })}
            </ul>) : <Filler />}
        </div>
        <input type='file' multiple accept='.dat' onChange={handleFileUpload} ref={inputDataFile} className='nodisplay'/>
        <input type='file' accept='.xlsx, .xls' onChange={handleFileUpload} ref={inputEnergyFile} className='nodisplay'/>
        {title === 'Data' && fil.length > 0 ? <Button cl='RES-btn' content='Descargar RTQ RES521-24' click={handleResDownload} enabled={true} /> : null}
    </div>
  )
}

export default Dropbox