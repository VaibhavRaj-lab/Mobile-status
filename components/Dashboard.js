import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Button, Dimensions } from 'react-native'
import NetInfo from '@react-native-community/netinfo';
import * as Battery from 'expo-battery';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';
import { database, storage } from '../firebaseConfig';

const Dashboard = () => {
    const [internetStatus, setInternetStatus] = useState('');
    const [batteryStatus, setBatteryStatus] = useState({
        charging: false,
        level: null,
    });
    const [captureCount, setCaptureCount] = useState(0);
    const [frequency, setFrequency] = useState(15);
    const [location, setLocation] = useState(null);
    const [timestamp, setTimestamp] = useState(null);
    const [photo, setPhoto] = useState(null);
    const cameraRef = useRef(null);
    const [uploadStatus, setUploadStatus] = useState(false)

    const captureDatas = async () => {
        try {
            // Get Battery Status

            const batteryLevel = await Battery.getBatteryLevelAsync();
            const batteryState = await Battery.getBatteryStateAsync();
            setBatteryStatus({
                charging: batteryState === Battery.BatteryState.CHARGING,
                level: batteryLevel * 100,
            });


            // Get location
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied.');
                return;
            }
            const currentLocation = await Location.getCurrentPositionAsync();
            setLocation(currentLocation);

            // Get internetConnectivity
            NetInfo.addEventListener((state) => {
                setInternetStatus(state.isConnected ? 'Connected' : 'Disconnected');
            });

            // Capture photo

            const { uri } = await cameraRef.current.takePictureAsync();
            console.log('Image captured:', uri);
            setPhoto(uri)
            // Upload photo to Firebase Storage
            const photoName = `photo_${Date.now()}.jpg`;
            const photoRef = storageRef(storage, 'photos/' + photoName);
            const response = await fetch(uri);
            const blob = await response.blob();
            await uploadBytes(photoRef, blob);

            // Get the photo URL from Firebase Storage
            const photoUrl = await getDownloadURL(photoRef);

            // Get CaptureCount
            setCaptureCount(prevCount => prevCount + 1);

            // Get timestamp
            const currentTimestamp = new Date().toLocaleString();
            setTimestamp(currentTimestamp);

            // Upload data to Firebase Database
            const dataRef = push(dbRef(database, 'data'));
            console.log(internetStatus, captureCount)
            await set(dataRef, {
                photoUrl: photoUrl,
                location: currentLocation,
                BatteryStatus: batteryStatus,
                captureCount: captureCount,
                timestamp: timestamp,
                frequency: frequency,
                connectivity: internetStatus

            });

            console.log('Data and photo uploaded successfully!');
            setUploadStatus(true)
        } catch (error) {
            console.log('Error capturing and uploading data:', error);
        }
    };
    useEffect(() => {
        const dataUpload = async () => {
            await captureDatas();
        }
        const interval = setInterval(captureDatas, 1000 * 60 * frequency);
        dataUpload()
        return () => {
            clearInterval(interval);
        };
    }, []);

    const handleManualRefresh = async () => {
        setUploadStatus(false)
        captureDatas()

    };


    const screenWidth = Dimensions.get('screen').width;
    const cameraSize = screenWidth * 0.1;

    return (
        <View style={styles.container}>
            <Text style={styles.companyName}>SecqurAIse</Text>
            <Text style={styles.timestamp}>Timestamp: {timestamp}</Text>
            <View style={styles.photoContainer}>
                {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : <Text>No Photo Captured</Text>}
            </View>
            <View style={styles.rowContainer}>
                <Text style={styles.label}>Capture Count</Text>
                <Text style={styles.value}>{captureCount}</Text>
            </View>
            <View style={styles.rowContainer}>
                <Text style={styles.label}>Frequency</Text>
                <Text style={styles.value}>{frequency}</Text>
            </View>
            <View style={styles.rowContainer}>
                <Text style={styles.label}>Connectivity</Text>
                <Text style={styles.value}>{internetStatus ? "Yes" : "No"}</Text>
            </View>
            <View style={styles.rowContainer}>
                <Text style={styles.label}>Battery Charging:</Text>
                <Text style={styles.value}>{batteryStatus.charging ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.rowContainer}>
                <Text style={styles.label}>Battery Charge:</Text>
                <Text style={styles.value}>{batteryStatus.level}%</Text>
            </View>
            <View style={styles.rowContainer}>
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{location ? `${location.coords.latitude}, ${location.coords.longitude}` : 'Loading...'}</Text>
            </View>
            <Camera style={[styles.camera, { width: cameraSize, height: cameraSize, position: 'absolute', top: 0, left: 0 }]} type={Camera.Constants.Type.back} ref={cameraRef}>
            </Camera>
            <Button title="Manual Refresh Data" onPress={handleManualRefresh} />
            {uploadStatus && <Text style={{ color: "white" }}>Data Uploaded successfully</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: "black"
    },
    rowContainer: {
        flexDirection: 'row',
        width: 320,
        marginBottom: 5,
        justifyContent: "space-between"
    },
    companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: "yellow"
    },
    timestamp: {
        color: 'white',
        fontSize: 18,
        marginBottom: 10,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: "white"
    },
    value: {
        fontSize: 16,
        marginBottom: 10,
        color: "green"
    },
    photoContainer: {
        width: 300,
        height: 300,
        borderWidth: 1,
        borderColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    photo: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
});

export default Dashboard;
