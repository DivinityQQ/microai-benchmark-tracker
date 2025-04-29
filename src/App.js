import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Define the possible status values and their colors
  const STATUS = {
    NOT_STARTED: { value: 'Not Started', color: '#f0f0f0' },
    COLLECTED: { value: 'Collected', color: '#c6efce' },
    UNABLE_TO_RUN: { value: 'Unable to Run', color: '#ffc7ce' }
  };

  // Boards extracted from platformio.ini
  const boards = [
    'ESP32',
    'ESP32-S3',
    'ESP32-C6',
    'ESP32-P4',
    'Raspberry Pi Pico W',
    'Arduino Nano 33 BLE',
    'Teensy 4.0',
    'STM32 Nucleo L552ZE-Q',
    'STM32 Nucleo F207ZG'
  ];

  // Main benchmark categories
  const benchmarkCategories = [
    { 
      name: 'Person Detection', 
      variants: ['Standard'] 
    },
    { 
      name: 'Speech Yes No', 
      variants: ['Standard'] 
    },
    { 
      name: 'KWS Scrambled', 
      variants: ['8-bit Model', 'Standard Model'] 
    },
    { 
      name: 'Visual Wakeword', 
      variants: ['128x128x1 Model', '96x96x3 Model'] 
    },
    { 
      name: 'Keyword Spotting', 
      variants: [
        'CNN Small Float32', 
        'CNN Medium Float32',
        'CNN Small Int8',
        'CNN Medium Int8',
        'CNN Large Int8',
        'DNN Small Int8',
        'DNN Medium Int8',
        'DNN Large Int8',
        'DNN Small Float32',
        'DNN Medium Float32',
        'DS-CNN Small Int8',
        'DS-CNN Medium Int8',
        'DS-CNN Large Int8',
        'DS-CNN Small Float32',
        'DS-CNN Medium Float32',
        'DS-CNN Small Int16',
        'MicroNet Small Int8',
        'MicroNet Medium Int8'
      ] 
    },
    { 
      name: 'Noise Reduction', 
      variants: ['Standard'] 
    }
  ];

  // Initialize tracking data
  const initializeTrackingData = () => {
    const data = {};
    boards.forEach(board => {
      data[board] = {};
      benchmarkCategories.forEach(category => {
        category.variants.forEach(variant => {
          const benchmarkKey = `${category.name} - ${variant}`;
          data[board][benchmarkKey] = {
            small: STATUS.NOT_STARTED.value,
            fast: STATUS.NOT_STARTED.value,
            notes: ''
          };
        });
      });
    });
    return data;
  };

  // Merge saved data with current template to handle new boards/benchmarks
  const mergeTrackingData = (savedData) => {
    const currentData = initializeTrackingData();
    
    // Start with current template with all boards and benchmarks
    const mergedData = {...currentData};
    
    // Copy over values from saved data where they exist
    for (const board in savedData) {
      if (mergedData[board]) {
        for (const benchmark in savedData[board]) {
          if (mergedData[board][benchmark]) {
            mergedData[board][benchmark] = savedData[board][benchmark];
          }
        }
      }
    }
    
    return mergedData;
  };

  const [trackingData, setTrackingData] = useState(() => {
    // Try to load data from localStorage
    const savedData = localStorage.getItem('benchmarkTrackingData');
    return savedData ? mergeTrackingData(JSON.parse(savedData)) : initializeTrackingData();
  });
  
  const [activeBoard, setActiveBoard] = useState(boards[0]);
  const [totalStatus, setTotalStatus] = useState({ notStarted: 0, collected: 0, unableToRun: 0 });
  const [noteInput, setNoteInput] = useState('');
  const [editingNote, setEditingNote] = useState(null);

  // Save to localStorage whenever trackingData changes
  useEffect(() => {
    localStorage.setItem('benchmarkTrackingData', JSON.stringify(trackingData));
  }, [trackingData]);

  // Update status counts
  useEffect(() => {
    let notStarted = 0;
    let collected = 0;
    let unableToRun = 0;

    boards.forEach(board => {
      Object.keys(trackingData[board]).forEach(benchmark => {
        if (trackingData[board][benchmark].small === STATUS.NOT_STARTED.value) notStarted++;
        if (trackingData[board][benchmark].small === STATUS.COLLECTED.value) collected++;
        if (trackingData[board][benchmark].small === STATUS.UNABLE_TO_RUN.value) unableToRun++;
        
        if (trackingData[board][benchmark].fast === STATUS.NOT_STARTED.value) notStarted++;
        if (trackingData[board][benchmark].fast === STATUS.COLLECTED.value) collected++;
        if (trackingData[board][benchmark].fast === STATUS.UNABLE_TO_RUN.value) unableToRun++;
      });
    });

    setTotalStatus({ notStarted, collected, unableToRun });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingData]);

  // Handle status change
  const handleStatusChange = (board, benchmark, optimization, newStatus) => {
    const updatedData = { ...trackingData };
    updatedData[board][benchmark][optimization] = newStatus;
    setTrackingData(updatedData);
  };

  // Cycle through statuses
  const cycleStatus = (board, benchmark, optimization) => {
    const currentStatus = trackingData[board][benchmark][optimization];
    let newStatus;
    
    if (currentStatus === STATUS.NOT_STARTED.value) {
      newStatus = STATUS.COLLECTED.value;
    } else if (currentStatus === STATUS.COLLECTED.value) {
      newStatus = STATUS.UNABLE_TO_RUN.value;
    } else {
      newStatus = STATUS.NOT_STARTED.value;
    }
    
    handleStatusChange(board, benchmark, optimization, newStatus);
  };

  // Get status color
  const getStatusColor = (status) => {
    if (status === STATUS.NOT_STARTED.value) return STATUS.NOT_STARTED.color;
    if (status === STATUS.COLLECTED.value) return STATUS.COLLECTED.color;
    if (status === STATUS.UNABLE_TO_RUN.value) return STATUS.UNABLE_TO_RUN.color;
    return 'white';
  };

  // Format date for filename
  const formatDateForFilename = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}-${minutes}`;
  };

  // Save data to JSON file with timestamp in filename
  const exportData = () => {
    const jsonData = JSON.stringify(trackingData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const timestamp = formatDateForFilename();
    
    const link = document.createElement('a');
    link.href = href;
    link.download = `benchmark_tracking_data_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import data from JSON file
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        setTrackingData(mergeTrackingData(importedData));
      } catch (error) {
        alert('Failed to parse the imported file. Please make sure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = null;
  };

  // Handle note editing
  const startEditingNote = (benchmark) => {
    setEditingNote(benchmark);
    setNoteInput(trackingData[activeBoard][benchmark].notes || '');
  };

  const saveNote = (benchmark) => {
    const updatedData = { ...trackingData };
    updatedData[activeBoard][benchmark].notes = noteInput;
    setTrackingData(updatedData);
    setEditingNote(null);
    setNoteInput('');
  };

  // Get progress percentage
  const getProgress = () => {
    const total = totalStatus.notStarted + totalStatus.collected + totalStatus.unableToRun;
    if (total === 0) return 0;
    return Math.round((totalStatus.collected + totalStatus.unableToRun) / total * 100);
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto bg-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Benchmark Tracking</h1>
        <div className="flex items-center space-x-2">
          <button 
            className="px-3 py-1 bg-blue-500 text-white rounded"
            onClick={exportData}
          >
            Export Data
          </button>
          <input
            type="file"
            id="importData"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
          <label 
            htmlFor="importData" 
            className="px-3 py-1 bg-green-500 text-white rounded cursor-pointer"
          >
            Import Data
          </label>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Progress Summary</h3>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center">
            <div className="w-64 bg-gray-200 rounded-full h-4 mr-4">
              <div
                className="bg-green-500 h-4 rounded-full"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{getProgress()}% Complete</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2" style={{ backgroundColor: STATUS.NOT_STARTED.color }}></div>
              <span>Not Started: {totalStatus.notStarted}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2" style={{ backgroundColor: STATUS.COLLECTED.color }}></div>
              <span>Collected: {totalStatus.collected}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2" style={{ backgroundColor: STATUS.UNABLE_TO_RUN.color }}></div>
              <span>Unable to Run: {totalStatus.unableToRun}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Board selection tabs */}
      <div className="flex overflow-x-auto pb-2 border-b">
        {boards.map(board => (
          <button
            key={board}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${activeBoard === board ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveBoard(board)}
          >
            {board}
          </button>
        ))}
      </div>

      {/* Tracking table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Benchmark
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Small Opt.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Fast Opt.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {benchmarkCategories.map((category) => (
              <React.Fragment key={category.name}>
                {category.variants.map((variant, index) => {
                  const benchmarkKey = `${category.name} - ${variant}`;
                  return (
                    <tr key={benchmarkKey} className={index === 0 ? 'border-t-2 border-gray-300' : ''}>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {index === 0 && category.variants.length > 1 ? (
                          <>
                            <span className="font-bold">{category.name}</span><br/>
                            <span className="text-xs text-gray-500 ml-2">└ {variant}</span>
                          </>
                        ) : index > 0 ? (
                          <span className="text-xs text-gray-500 ml-2">└ {variant}</span>
                        ) : (
                          category.name
                        )}
                      </td>
                      <td 
                        className="px-6 py-2 whitespace-nowrap text-sm text-center cursor-pointer"
                        style={{ backgroundColor: getStatusColor(trackingData[activeBoard][benchmarkKey].small) }}
                        onClick={() => cycleStatus(activeBoard, benchmarkKey, 'small')}
                      >
                        {trackingData[activeBoard][benchmarkKey].small}
                      </td>
                      <td 
                        className="px-6 py-2 whitespace-nowrap text-sm text-center cursor-pointer"
                        style={{ backgroundColor: getStatusColor(trackingData[activeBoard][benchmarkKey].fast) }}
                        onClick={() => cycleStatus(activeBoard, benchmarkKey, 'fast')}
                      >
                        {trackingData[activeBoard][benchmarkKey].fast}
                      </td>
                      <td className="px-6 py-2 text-sm">
                        {editingNote === benchmarkKey ? (
                          <div className="flex">
                            <input
                              type="text"
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              className="flex-grow px-2 py-1 border rounded"
                              placeholder="Add a note..."
                            />
                            <button
                              onClick={() => saveNote(benchmarkKey)}
                              className="ml-2 px-2 py-1 bg-blue-500 text-white rounded"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div 
                            onClick={() => startEditingNote(benchmarkKey)}
                            className="cursor-pointer min-h-[24px]"
                          >
                            {trackingData[activeBoard][benchmarkKey].notes || (
                              <span className="text-gray-400 text-xs">Click to add a note</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Click on a status cell to cycle through statuses: Not Started → Collected → Unable to Run → Not Started</p>
        <p>Click on a note cell to add or edit notes for a specific benchmark.</p>
        <p>Use the Export/Import buttons to save or load your progress when switching devices.</p>
      </div>
    </div>
  );
}

export default App;