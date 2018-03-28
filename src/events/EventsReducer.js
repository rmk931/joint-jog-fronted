import * as types from './EventsActionTypes';

const initialState = {
    error: ''
};

export const events = (state = initialState, action) => {
    switch (action.type) {
        case types.UNSUBSCRIBE_EVENT_REQUEST_SUCCESS:
        case types.SUBSCRIBE_EVENT_REQUEST_SUCCESS:
            return {
                ...state,
                error: ''
            };
        case types.UNSUBSCRIBE_EVENT_REQUEST_ERROR:
        case types.SUBSCRIBE_EVENT_REQUEST_ERROR:
            return {
                ...state,
                error: action.error
            };
        default:
            return state;
    }
};
