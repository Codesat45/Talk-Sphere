# Talk-Sphere Testing Guide

## 🧪 How to Test All Features

### Prerequisites
- Server running on http://localhost:5000 ✅
- Client running on http://localhost:3000 ✅
- Two browser windows/tabs for testing calls (or two devices)

---

## 1. Testing Profile Settings

### Steps:
1. Open http://localhost:3000
2. Login or create an account
3. Click the **Profile icon** (1st icon in left sidebar)
4. Click **Edit Profile** button
5. Change your name and about section
6. Click **Save**
7. Click **Change Profile Picture**
8. Upload a new image
9. Verify changes appear immediately

**Expected Result:** ✅ Profile updates successfully and shows new information

---

## 2. Testing Call Logs

### Steps:
1. Click the **Call Logs icon** (5th icon - phone icon in left sidebar)
2. View the call history list
3. Make a test call (audio or video)
4. End the call after a few seconds
5. Return to Call Logs
6. Verify the new call appears in the list

**Expected Result:** ✅ Call logs display with:
- Call type (audio/video)
- Duration (MM:SS format)
- Timestamp
- Incoming/Outgoing indicator
- Color-coded icons

**Empty State:** If no calls yet, shows "No call history yet" message

---

## 3. Testing Story Upload

### Steps:
1. Select any chat from the chat list
2. Look at the **story strip** at the top of the chat window
3. Click the **Upload button** (image icon) in the story strip
4. Select an image or video file (max 10MB)
5. Wait for "✓ Media uploaded" confirmation
6. Optionally add text in the input field
7. Click the **Post button** (+ icon)
8. Verify story appears in the story list

**To View Stories:**
1. Click on any story avatar in the story strip
2. Story opens in modal overlay
3. Shows image/video and text
4. Shows view count
5. If it's your story, you can delete it

**Expected Result:** ✅ Story uploads successfully and appears to all contacts

---

## 4. Testing Video Calls (Both Ends Visible)

### Setup:
- Open two browser windows/tabs
- Login with different accounts in each
- Add each other as contacts

### Steps:
1. **Window 1:** Select the contact
2. **Window 1:** Click the **Video Call button** (camera icon in header)
3. Allow camera and microphone permissions
4. **Window 2:** Incoming call notification appears
5. **Window 2:** Click **Accept**
6. Allow camera and microphone permissions

**Verify:**
- ✅ **Window 1:** See your own video (local) and remote person's video
- ✅ **Window 2:** See your own video (local) and remote person's video
- ✅ Both videos are visible and playing
- ✅ Call timer appears showing duration (MM:SS)
- ✅ Call status shows "Connected"

### Test Call Controls:
1. **Mic Toggle:** Click mic button - verify audio mutes/unmutes
2. **Camera Toggle:** Click camera button - verify video turns on/off
3. **Speaker Toggle:** Click speaker button - verify audio output mutes/unmutes
4. **Screen Share:** Click screen share button - verify screen sharing works
5. **End Call:** Click red "End" button - verify call ends properly

**Expected Result:** ✅ Both users see each other's video and all controls work

---

## 5. Testing Audio Calls

### Steps:
1. **Window 1:** Select the contact
2. **Window 1:** Click the **Audio Call button** (phone icon in header)
3. Allow microphone permission
4. **Window 2:** Click **Accept**
5. Allow microphone permission

**Verify:**
- ✅ **Window 1:** See your avatar and remote person's avatar (no video)
- ✅ **Window 2:** See your avatar and remote person's avatar (no video)
- ✅ Audio is working both ways
- ✅ Call timer appears
- ✅ Mic and speaker controls work
- ✅ Camera and screen share buttons are hidden (audio only)

**Expected Result:** ✅ Audio call works with avatar display instead of video

---

## 6. Testing Call History Saving

### Steps:
1. Make a video call and stay connected for 30+ seconds
2. End the call
3. Click **Call Logs icon** in sidebar
4. Verify the call appears with:
   - Correct duration (e.g., "0:35")
   - Correct call type (video icon)
   - Correct timestamp
   - "Outgoing" label for caller
   - "Incoming" label for receiver

**Expected Result:** ✅ Call history is saved to database and displays correctly

---

## 7. Testing Message Features

### Delete Message for Me:
1. Send a message
2. Hover over the message
3. Click the **yellow delete icon** (Delete for me)
4. Confirm deletion
5. Verify message disappears from your view only

### Delete Message for Everyone:
1. Send a message (must be your own message)
2. Hover over the message
3. Click the **red delete icon** (Delete for everyone)
4. Confirm deletion
5. Verify message disappears for both users

### File Upload:
1. Click the **image icon** in the message input area
2. Select an image, video, or document
3. Wait for upload confirmation
4. Message sends with the file
5. Click the file to view/download

**Expected Result:** ✅ All message features work correctly

---

## 8. Testing Story Viewing

### Steps:
1. After posting a story, click on your story avatar
2. Story modal opens showing:
   - Your profile picture and name
   - The media (image/video)
   - The text content
   - View count
   - Delete button (for your own stories)
3. Click **Delete story** to remove it
4. Click **X** to close the modal

**Expected Result:** ✅ Stories display correctly and can be deleted

---

## 🐛 Common Issues and Solutions

### Issue: Camera/Microphone not working
**Solution:** 
- Check browser permissions
- Allow camera/microphone access when prompted
- Try refreshing the page
- Check if another app is using the camera

### Issue: Remote video not visible
**Solution:**
- Ensure both users have granted camera permissions
- Check internet connection
- Try ending and restarting the call
- Check browser console for errors

### Issue: Call ends immediately
**Solution:**
- This was fixed in the latest update
- Ensure you're using the latest code
- Check that `callDurationRef` is being used correctly

### Issue: Story upload fails
**Solution:**
- Check file size (must be < 10MB)
- Ensure file is an image or video
- Check internet connection
- Verify Cloudinary configuration in server

### Issue: Call logs not showing
**Solution:**
- Make at least one call first
- Ensure call was connected (not just ringing)
- Check that call duration > 0
- Refresh the Call Logs tab

---

## ✅ Feature Checklist

Use this checklist to verify all features:

- [ ] Profile settings - Edit name
- [ ] Profile settings - Edit about
- [ ] Profile settings - Change profile picture
- [ ] Call logs - View history
- [ ] Call logs - Shows correct duration
- [ ] Call logs - Shows call type icons
- [ ] Story upload - Direct file upload
- [ ] Story upload - Upload confirmation
- [ ] Story upload - Post with text
- [ ] Story viewing - Modal display
- [ ] Story viewing - Delete own story
- [ ] Video call - Local video visible
- [ ] Video call - Remote video visible
- [ ] Video call - Call timer working
- [ ] Video call - Mic toggle works
- [ ] Video call - Camera toggle works
- [ ] Video call - Speaker toggle works
- [ ] Video call - Screen share works
- [ ] Audio call - Avatars display
- [ ] Audio call - Audio works both ways
- [ ] Audio call - Controls work
- [ ] Call history - Saves to database
- [ ] Call history - Displays in logs
- [ ] Message delete - For me only
- [ ] Message delete - For everyone
- [ ] File upload - Images
- [ ] File upload - Videos
- [ ] File upload - Documents

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________

Feature: Profile Settings
Status: [ ] Pass [ ] Fail
Notes: _______________________

Feature: Call Logs
Status: [ ] Pass [ ] Fail
Notes: _______________________

Feature: Story Upload
Status: [ ] Pass [ ] Fail
Notes: _______________________

Feature: Video Calls
Status: [ ] Pass [ ] Fail
Notes: _______________________

Feature: Audio Calls
Status: [ ] Pass [ ] Fail
Notes: _______________________

Feature: Call History
Status: [ ] Pass [ ] Fail
Notes: _______________________
```

---

## 🎯 Performance Testing

### Load Testing:
1. Create multiple stories (10+)
2. Make multiple calls (20+)
3. Send many messages (100+)
4. Verify app remains responsive

### Network Testing:
1. Test calls on slow network
2. Test file uploads on slow network
3. Verify graceful degradation

---

## 📝 Notes

- All features have been implemented and tested
- Server and client are running without errors
- No diagnostic issues found in the code
- WebRTC configuration includes TURN servers for better connectivity
- File uploads are limited to 10MB for performance
- Call history is automatically saved when calls end

---

**Happy Testing! 🎉**

If you encounter any issues, check the browser console for error messages and refer to the troubleshooting section above.
