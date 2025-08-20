
import React, { useState, useEffect } from 'react';

interface PinPadProps {
  onPinSubmit: (pin: string) => void;
  pinLength?: number;
  title: string;
  reset?: boolean; // prop to reset the component
}

const PinPad: React.FC<PinPadProps> = ({ onPinSubmit, pinLength = 4, title, reset }) => {
  const [pin, setPin] = useState('');

  useEffect(() => {
      if(reset) {
          setPin('');
      }
  }, [reset]);

  useEffect(() => {
    if (pin.length === pinLength) {
      const submittedPin = pin;
      // Clear pin for next attempt after a short delay
      setTimeout(() => setPin(''), 200);
      onPinSubmit(submittedPin);
    }
  }, [pin, pinLength, onPinSubmit]);

  const handleNumberClick = (num: string) => {
    if (pin.length < pinLength) {
      setPin(pin + num);
    }
  };

  const handleDeleteClick = () => {
    setPin(pin.slice(0, -1));
  };

  const renderPinDots = () => {
    const dots = [];
    for (let i = 0; i < pinLength; i++) {
      dots.push(
        <div
          key={i}
          className={`w-4 h-4 rounded-full mx-2 transition-colors duration-200 ${
            i < pin.length ? 'bg-indigo-500' : 'bg-gray-300'
          }`}
        ></div>
      );
    }
    return dots;
  };

  const numberButtons = [
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '', '0', '⌫'
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto">
      <h3 className="mb-4 text-xl font-semibold text-gray-700">{title}</h3>
      <div className="flex justify-center mb-6">{renderPinDots()}</div>
      <div className="grid grid-cols-3 gap-4">
        {numberButtons.map((btn, index) => {
          if (btn === '') {
            return <div key={index}></div>; // Empty space
          }
          const isDelete = btn === '⌫';
          return (
            <button
              key={index}
              onClick={() => (isDelete ? handleDeleteClick() : handleNumberClick(btn))}
              className="flex items-center justify-center w-16 h-16 text-2xl font-semibold text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={isDelete ? 'Delete last digit' : `Number ${btn}`}
            >
              {btn}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PinPad;
