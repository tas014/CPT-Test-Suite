import React from 'react'
import * as XLSX from 'xlsx'
import { useState } from 'react'

const Filebox = () => {
    const [data, setData] = useState([])
    const handleFileUpload = e => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(e.target.files[0]);
        reader.onload = p => {
            const data = p.target.result;
            const workbook = XLSX.read(data, {type:'binary'});
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const parsedData = XLSX.utils.sheet_to_json(sheet);
            setData(parsedData);
            console.log(data, workbook, sheetName, sheet)
        }
        console.log('file uploaded')
    }

  return (
    <>
        <div>
            <input type='file' accept='.xlsx, .xls, .dat' onChange={handleFileUpload} multiple/>
        </div>
        {data.length > 0 && (
            <table>
                <thead>
                    <tr>{Object.keys(data[0]).map( key => (
                        <th key={key}>{key}</th>
                    ))}</tr>
                </thead>
                <tbody>
                    {data.map((row, ind) => (
                        <tr key={ind}>
                            {Object.values(row).map((v, ind) => (
                                <td key={ind}>{v}</td>
                            ))}
                        </tr>
                    )

                    )}
                </tbody>
            </table>
        )}
    </>
  )
}

export default Filebox