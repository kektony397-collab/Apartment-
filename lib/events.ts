export const DATA_CHANGED_EVENT = 'datachanged';

export const dispatchDataChangedEvent = () => {
    window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
};
