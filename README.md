# Backend
## Prerequisites:
- Node should be installed (version 18.20.3)
- MongoDB should be installed

## Clone the repository
```
git clone https://github.com/samba0648/eduTrack.git
cd eduTrack/backend
```
## Install the dependencies
```
npm install
```
## Add the environmental variables
```
PORT=8000
MONGO_URI=mongodb://localhost:27017/eduSmart # db link
JWT_SECRET=secret-key

EMAIL_USER=mail
EMAIL_PASS=pass
```
## Run the server
```
npm run dev
```


# Frontend
## Prerequisites:
- Node should be installed
- Install react-native
- Install react-native-cli
- Install Android Studio
- Install Xcode (Only Mac OS)
- Recommend - All the major testing done on IOS (iPhone)

## Clone the repository
```
git clone https://github.com/samba0648/eduTrack.git
cd eduTrack/app
```
## Install the dependencies
```
npm install
```
## Mac OS
```
cd ios
pod install
cd ..
```

## Install Application

```
npx react-native run-ios
npx react-native run-android
```
## Start metro
```
npm start
```

