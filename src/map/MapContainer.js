import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Hidden } from 'material-ui';
import { YMaps, Map, Placemark, ZoomControl, SearchControl }from 'react-yandex-maps';
import PropTypes from 'prop-types';

import * as actions from './MapActions';

import PointsShowList from './PointsShowList';
import PointsEditorList from './PointsEditList';
import EventPointsList from './EventPointsList';

class MapContainer extends Component {
    static propTypes = {
        editorMode: PropTypes.bool,
        showAll: PropTypes.bool,
        showOne: PropTypes.bool,
        showEvent: PropTypes.object,
        showRoute: PropTypes.bool.isRequired,
        userWhere: PropTypes.array.isRequired,
        currentEventPointsList: PropTypes.array.isRequired,
        editorPointsList: PropTypes.array.isRequired,
        currentMap: PropTypes.object.isRequired,
        setCurrentMapInfo: PropTypes.func.isRequired,
        setUserPosition: PropTypes.func.isRequired
    }

    static defaultProps = {
        editorMode: false,
        showAll: false,
        showOne: false,
        showEvent: {}
    }

    constructor(props) {
        super(props);

        this.ymaps = null;
        this.route = null;
        this.searchControl = null;
        this.mapControl = null;
    }

    componentDidMount() {
        if (window.navigator.geolocation) {
            window.navigator.geolocation.getCurrentPosition(position => {
                const latitude = position.coords.latitude;
                if (this.props.userWhere[0] === latitude) {
                    // Abort dispatch unnecessary action
                    return;
                }
                const longitude = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                this.props.setUserPosition(latitude, longitude, accuracy);
            }, (err) => {
                console.log('Cannot receive geoposition');
            }, {enableHighAccuracy:true});
        } else {
            console.log('Cannot receive geoposition');
        }
    }

    componentWillReceiveProps(nextProps) {
        if(this.props.showRoute !== nextProps.showRoute) {
            if(nextProps.showRoute) {
                this.showRoute();
            } else {
                this.hideRoute();
            }
        }
    }

    componentWillUnmount() {
        this.removeMapEventListeners();
    }

    setSearchControlRef = (ref) => {
        this.searchControl = ref;
    }

    setMapControlRef = (ref) => {
        this.mapControl = ref;
        this.addMapEventListeners();
    }

    showRoute() {
        const points = this.props.showOne ? this.props.currentEventPointsList : this.props.editorPointsList;
        this.route = new this.ymaps.multiRouter.MultiRoute({
            referencePoints: points.map((el) => [el.latitude, el.longitude]),
            params: {
                routingMode: 'pedestrian',
                results: 1
            }
        },{
            editorDrawOver: false,
            routeStrokeColor: '3f51b5',
            routeActiveStrokeColor: '3f51b5',
            pinIconFillColor: '3f51b5',
            boundsAutoApply: true,
            zoomMargin: 68
        });
        this.mapControl.geoObjects.add(this.route);
    }

    hideRoute() {
        this.mapControl && this.mapControl.geoObjects.remove(this.route);
    }
    
    addMapEventListeners() {
        if(!this.mapControl) {
            return;
        }

        this.mapControl.events.add('boundschange', (event) => {
            const center = event.get('newCenter');
            const zoom = event.get('newZoom');
            if (center[0] !== this.props.currentMap.center[0] 
            && center[1] !== this.props.currentMap.center[1]) {
                this.props.setCurrentMapInfo(center, zoom);
            }
        });
    }

    removeMapEventListeners() {
        if(!this.mapControl) {
            return;
        }

        this.mapControl.events.remove('actionend');
    }

    onApiAvaliable(ymaps) {
        this.ymaps = ymaps;
    }

    render() {
        return(
            <YMaps onApiAvaliable={(ymaps) => this.onApiAvaliable(ymaps)}>
                <Map state={
                    {
                        center: this.props.currentMap.center, 
                        zoom: this.props.currentMap.zoom, 
                        controls: []
                    }}
                    width="100%"
                    height="100%"
                    instanceRef={this.setMapControlRef}
                    >
                    <Hidden smDown>
                        <SearchControl
                            instanceRef={this.setSearchControlRef}
                            options={searchControlOptions}
                        />
                        <ZoomControl options={zoomControlOptions} />
                    </Hidden>
                    <Placemark
                        geometry={{
                            coordinates: this.props.userWhere
                        }}
                        properties={{
                            hintContent: 'Вы тут',
                            iconContent: 'Я'
                        }}
                        options={{
                            preset: 'islands#nightCircleIcon'
                        }}
                    />
                    {this.props.editorMode && <PointsEditorList/>}
                    {this.props.showAll && <PointsShowList/>}
                    {this.props.showOne && <EventPointsList/>}
                </Map>
            </YMaps>
        );
    }
}

const searchControlOptions = { 
    position: {
        top: '80px',
        left: '25px'
    },
    size: 'large',
    noPlacemark: true
};

const zoomControlOptions = {
    position: {
        top: '120px',
        left: '25px'
    },
};

const mapStateToProps = state => ({
    editorPointsList: state.map.editorPointsList,
    currentEventPointsList: state.map.currentEventPointsList,
    currentMap: state.map.currentMap,
    showRoute: state.map.showRoute,
    userWhere: [state.map.userWhere.latitude, state.map.userWhere.longitude]
});

const mapDispatchToProps = {
    setUserPosition: actions.setUserPosition,
    setCurrentMapInfo: actions.setCurrentMapInfo
};

export default connect(mapStateToProps, mapDispatchToProps)(MapContainer);