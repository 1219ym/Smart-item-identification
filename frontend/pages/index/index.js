// index.js
Page({
  data: {
    cameraAuthorized: false,
    showResultModal: false,
    recognitionResult: [],
    showFullContent: false,
    isCameraOpen: false,
    cameraContext: null,
  },

  onLoad: function () {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.camera']) {
          this.setData({ cameraAuthorized: true });
        } else {
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              this.setData({ cameraAuthorized: true });
            },
          });
        }
      },
    });
  },

  toggleCamera: function () {
    const { isCameraOpen } = this.data;

    this.setData({
      isCameraOpen: !isCameraOpen,
    });

    if (isCameraOpen) {
      // Camera is closing, perform any cleanup if needed
    } else {
      // Camera is opening, create a new camera context
      const ctx = wx.createCameraContext();
      this.setData({
        cameraContext: ctx,
      });
    }
  },

  takePhoto: function () {
    const { isCameraOpen, cameraContext } = this.data;

    if (!isCameraOpen || !cameraContext) {
      wx.showToast({
        title: '请先打开摄像头',
        icon: 'none',
        duration: 2000,
      });
      return;
    }

    cameraContext.takePhoto({
      quality: 'high',
      success: (res) => {
        wx.uploadFile({
          url: 'http://10.141.18.224:5473/recognize',
          filePath: res.tempImagePath,
          name: 'image',
          method: 'POST',
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              console.log('服务器响应:', data);
              if (data.result) {
                const recognitionResult = data.result.map(item => ({
                  keyword: item.keyword,
                  baike_info: JSON.stringify(item.baike_info),
                }));

                this.setData({
                  recognitionResult: recognitionResult,
                  showResultModal: true,
                });
              } else {
                console.error('服务器响应中缺少识别结果。');
              }
            } catch (error) {
              console.error('解析 JSON 出错:', error);
            }
          },
          fail: (error) => {
            console.error('上传图片失败:', error);
          },
        });
      },
      fail: (error) => {
        console.error('拍照失败:', error);
      },
    });
  },

  showMore: function () {
    this.setData({
      showFullContent: !this.data.showFullContent,
    });
  },

  closeModal: function () {
    this.setData({ showResultModal: false });
  },

  chooseImage: function () {
    // Your existing logic for choosing an image
    const that = this;

    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths[0];

        wx.uploadFile({
          url: 'http://10.141.18.224:5473/recognize',
          filePath: tempFilePaths,
          name: 'image',
          method: 'POST',
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              console.log('服务器响应:', data);
              if (data.result) {
                const recognitionResult = data.result.map(item => ({
                  keyword: item.keyword,
                  baike_info: JSON.stringify(item.baike_info),
                }));

                that.setData({
                  recognitionResult: recognitionResult,
                  showResultModal: true,
                });
              } else {
                console.error('服务器响应中缺少识别结果。');
              }
            } catch (error) {
              console.error('解析 JSON 出错:', error);
            }
          },
          fail: (error) => {
            console.error('上传图片失败:', error);
          },
        });
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
      },
    });
  },
});
