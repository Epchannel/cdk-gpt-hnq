(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isLocalTest = false;

  var progress = document.getElementById("scrollProgress");
  function updateProgress() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    progress.style.width = (max ? (doc.scrollTop / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el, index) {
      el.style.transitionDelay = Math.min(index % 6, 5) * 0.055 + "s";
      io.observe(el);
    });
  }

  document.querySelectorAll(".faq-item").forEach(function (item) {
    item.addEventListener("toggle", function () {
      if (!item.open) return;
      document.querySelectorAll(".faq-item").forEach(function (other) {
        if (other !== item) other.open = false;
      });
    });
  });

  var hero = document.querySelector(".hero");
  var spot = document.getElementById("heroSpot");
  var mock = document.getElementById("heroMock");
  if (hero && !reduce) {
    hero.addEventListener("mousemove", function (event) {
      var rect = hero.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width;
      var y = (event.clientY - rect.top) / rect.height;
      spot.style.setProperty("--mx", x * 100 + "%");
      spot.style.setProperty("--my", y * 100 + "%");
      mock.style.transform = "translate(-50%,-50%) perspective(900px) rotateX(" + ((0.5 - y) * 8) + "deg) rotateY(" + ((x - 0.5) * 10) + "deg)";
    });
    hero.addEventListener("mouseleave", function () {
      mock.style.transform = "translate(-50%,-50%)";
    });
  }

  var ticker = document.getElementById("tickerTrack");
  if (ticker) ticker.innerHTML += ticker.innerHTML;

  var cdkForm = document.getElementById("cdkForm");
  var cdkInput = document.getElementById("cdkInput");
  var cdkSubmit = document.getElementById("cdkSubmit");
  var cdkResult = document.getElementById("cdkResult");
  var stepTwoBox = document.getElementById("stepTwoBox");
  var stepTwoPill = document.getElementById("stepTwoPill");
  var sessionForm = document.getElementById("sessionForm");
  var sessionInput = document.getElementById("sessionInput");
  var sessionSubmit = document.getElementById("sessionSubmit");
  var sessionSummaryBox = document.getElementById("sessionSummaryBox");
  var summaryName = document.getElementById("summaryName");
  var summaryEmail = document.getElementById("summaryEmail");
  var summaryPlan = document.getElementById("summaryPlan");
  var summaryStructure = document.getElementById("summaryStructure");
  // URL gốc của API. Để fix CORS trên GitHub Pages/Local, hãy triển khai Cloudflare Workers làm Proxy
  // và đổi giá trị này thành URL của Worker của bạn (ví dụ: "https://your-worker.workers.dev/api").
  var API_BASE_URL = "https://cdkgpt.hangngaquan.workers.dev/api";

  var CODE_INFO_URL = API_BASE_URL + "/code-info";
  var CODE_SUBMIT_URL = API_BASE_URL + "/submit";
  var CODE_STATUS_URL = API_BASE_URL + "/status";
  var lastCdkSuccessMsg = "";

  function setCdkResult(type, icon, text) {
    cdkResult.className = "cdk-result" + (type ? " " + type : "");
    cdkResult.innerHTML = '<i class="fa-solid ' + icon + '"></i><span>' + text + '</span>';
  }

  function normalizeCdkMessage(message) {
    if (!message) return "CDK không hợp lệ hoặc đã hết lượt.";
    if (message.indexOf("卡密配额已用完") !== -1) return "CDK đã hết lượt sử dụng.";
    if (message.indexOf("卡密不存在") !== -1) return "Mã CDK không tồn tại trên hệ thống.";
    return message;
  }

  function rc4(key, str) {
    var s = [], j = 0, x, res = '';
    for (var i = 0; i < 256; i++) {
      s[i] = i;
    }
    for (var i = 0; i < 256; i++) {
      j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
      x = s[i]; s[i] = s[j]; s[j] = x;
    }
    var i = 0; j = 0;
    for (var y = 0; y < str.length; y++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;
      x = s[i]; s[i] = s[j]; s[j] = x;
      res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
    }
    return res;
  }

  function encryptPayload(payload) {
    var key = "HNQ_SECURE_KEY_2026";
    var rawStr = JSON.stringify(payload);
    var utf8Str = btoa(unescape(encodeURIComponent(rawStr)));
    var encrypted = rc4(key, utf8Str);
    return btoa(encrypted);
  }

  var CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var CIPHER_KEY = "HNQ2026";

  function deobfuscateSuffix(suffix) {
    var result = "";
    for (var i = 0; i < suffix.length; i++) {
      var char = suffix[i];
      var idx = CHARSET.indexOf(char);
      if (idx === -1) {
        result += char;
        continue;
      }
      var keyChar = CIPHER_KEY[i % CIPHER_KEY.length];
      var keyShift = CHARSET.indexOf(keyChar);
      var newIdx = (idx - keyShift - i) % CHARSET.length;
      if (newIdx < 0) newIdx += CHARSET.length;
      result += CHARSET[newIdx];
    }
    return result;
  }

  function resolveBackendCdk(input) {
    if (!input) return "";
    var cleaned = input.replace(/\s+/g, "").toUpperCase();
    
    // Check if it starts with HNQ
    if (cleaned.indexOf("HNQ") === 0) {
      // Strip hyphens
      var raw = cleaned.replace(/-/g, "");
      // Length should be 16: "HNQ" (3) + 5 (random) + 8 (obfuscated) = 16
      if (raw.length === 16) {
        var obfuscatedSuffix = raw.substring(8); // last 8 characters
        var decodedSuffix = deobfuscateSuffix(obfuscatedSuffix);
        return "BX-" + decodedSuffix;
      }
    }
    return cleaned; // Fallback to raw input if it's already BX- format
  }

  if (cdkForm) {
    cdkForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var rawCode = cdkInput.value.trim();
      if (!rawCode) {
        setCdkResult("err", "fa-triangle-exclamation", "Vui lòng nhập mã CDK trước khi kiểm tra.");
        return;
      }

      var code = resolveBackendCdk(rawCode);

      cdkSubmit.disabled = true;
      cdkSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra';
      if (stepTwoBox) stepTwoBox.hidden = true;
      if (stepTwoPill) stepTwoPill.classList.remove("active");
      if (sessionInput) sessionInput.value = "";
      if (sessionSummaryBox) sessionSummaryBox.hidden = true;
      setCdkResult("", "fa-circle-notch fa-spin", "Đang gửi yêu cầu kiểm tra CDK...");

      try {
        var data;
        if (isLocalTest) {
          await new Promise(function (resolve) { setTimeout(resolve, 800); });
          if (code.toLowerCase() === "error" || code.toLowerCase() === "err") {
            data = { ok: false, msg: "CDK đã hết lượt sử dụng." };
          } else {
            data = { ok: true, remaining: 1, total: 1 };
          }
        } else {
          var response = await fetch(CODE_INFO_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: encryptPayload({ code: code })
          });
          data = await response.json();
        }

        if (data.ok) {
          lastCdkSuccessMsg = "CDK hợp lệ. Còn " + data.remaining + "/" + data.total + " lượt khả dụng.";
          setCdkResult("ok", "fa-circle-check", lastCdkSuccessMsg);
          if (stepTwoBox) stepTwoBox.hidden = false;
          if (stepTwoPill) stepTwoPill.classList.add("active");
        } else {
          setCdkResult("err", "fa-circle-xmark", normalizeCdkMessage(data.msg));
        }
      } catch (error) {
        setCdkResult("err", "fa-wifi", "Không thể kết nối API kiểm tra CDK. Chi tiết: " + (error.message || error) + ". Vui lòng thử lại hoặc liên hệ Telegram bot.");
      } finally {
        cdkSubmit.disabled = false;
        cdkSubmit.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Kiểm tra';
      }
    });
  }

  if (sessionForm) {
    sessionForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      var rawCode = cdkInput.value.trim();
      var sessionText = sessionInput.value.trim();
      if (!rawCode) {
        setCdkResult("err", "fa-triangle-exclamation", "Vui lòng nhập mã CDK ở Step 1 trước.");
        return;
      }

      var code = resolveBackendCdk(rawCode);
      if (!sessionText) {
        setCdkResult("err", "fa-triangle-exclamation", "Vui lòng nhập Session / Access Token.");
        return;
      }

      sessionSubmit.disabled = true;
      sessionSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang khởi tạo...';
      setCdkResult("", "fa-circle-notch fa-spin", "Đang kết nối hệ thống kích hoạt (quá trình này có thể mất tới 30-60 giây, vui lòng không tắt trang)...");

      try {
        var data;
        if (isLocalTest) {
          await new Promise(function (resolve) { setTimeout(resolve, 1500); });
          var parsedEmail = "menchyanaalu+ruthlmx@gmail.com";
          try {
            var parsed = JSON.parse(sessionText);
            if (parsed && parsed.user && parsed.user.email) parsedEmail = parsed.user.email;
          } catch(e) {}
          data = {
            ok: true,
            order_id: "mock_order_123456",
            email: parsedEmail,
            display_id: "PAY-MOCK1234",
            status: "processing"
          };
        } else {
          var response = await fetch(CODE_SUBMIT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: encryptPayload({
              code: code,
              at: sessionText
            })
          });
          data = await response.json();
        }

        if (data.ok) {
          var orderId = data.order_id;
          var displayId = data.display_id || ("PAY-" + orderId.substring(0, 8).toUpperCase());
          var email = data.email || "";
          
          setCdkResult("ok", "fa-circle-notch fa-spin", "Khởi tạo thành công! Đang xử lý kích hoạt Plus (Mã đơn: " + displayId + ")...");
          pollStatus(orderId, displayId, email);
        } else {
          setCdkResult("err", "fa-circle-xmark", normalizeCdkMessage(data.msg));
          resetSessionSubmitButton();
        }
      } catch (error) {
        setCdkResult("err", "fa-wifi", "Không thể gửi yêu cầu kích hoạt. Chi tiết: " + (error.message || error) + ". Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.");
        resetSessionSubmitButton();
      }
    });
  }

  if (sessionInput) {
    var dragEvents = ['dragenter', 'dragover', 'dragleave', 'drop'];
    for (var i = 0; i < dragEvents.length; i++) {
      sessionInput.addEventListener(dragEvents[i], function (e) {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    }

    var enterEvents = ['dragenter', 'dragover'];
    for (var j = 0; j < enterEvents.length; j++) {
      sessionInput.addEventListener(enterEvents[j], function () {
        sessionInput.classList.add('drag-over');
      }, false);
    }

    var leaveEvents = ['dragleave', 'drop'];
    for (var k = 0; k < leaveEvents.length; k++) {
      sessionInput.addEventListener(leaveEvents[k], function () {
        sessionInput.classList.remove('drag-over');
      }, false);
    }

    sessionInput.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      var files = dt.files;
      if (files && files.length > 0) {
        var file = files[0];
        if (file.name.toLowerCase().slice(-5) === '.json') {
          var reader = new FileReader();
          reader.onload = function (event) {
            sessionInput.value = event.target.result;
            setCdkResult("ok", "fa-file-code", "Đã đọc dữ liệu session từ file JSON thành công! Hãy nhấn Kích hoạt ngay.");
            updateSessionSummary();
          };
          reader.onerror = function () {
            setCdkResult("err", "fa-triangle-exclamation", "Không thể đọc nội dung file JSON.");
          };
          reader.readAsText(file);
        } else {
          setCdkResult("err", "fa-triangle-exclamation", "Vui lòng kéo thả file định dạng .json hợp lệ.");
        }
      }
    }, false);
  }

  function decodeJwt(token) {
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return null;
      var payloadSec = parts[1];
      var base64 = payloadSec.replace(/-/g, '+').replace(/_/g, '/');
      var padLen = (4 - (base64.length % 4)) % 4;
      for (var i = 0; i < padLen; i++) {
        base64 += '=';
      }
      var jsonStr = decodeURIComponent(escape(atob(base64)));
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  }

  function mergeJwtPayload(result, jwtPayload) {
    var profile = jwtPayload["https://api.openai.com/profile"] || {};
    if (!result.name) result.name = profile.name || jwtPayload.name || "";
    if (!result.email) result.email = profile.email || jwtPayload.email || "";
    if (!result.planType) {
      if (jwtPayload.features && jwtPayload.features.indexOf("plus") !== -1) {
        result.planType = "plus";
      }
    }
  }

  function parseSessionData(input) {
    var result = {
      name: "",
      email: "",
      planType: "",
      structure: ""
    };

    try {
      var parsed = JSON.parse(input);
      if (parsed) {
        if (parsed.user) {
          result.name = parsed.user.name || "";
          result.email = parsed.user.email || "";
        }
        if (parsed.account) {
          result.planType = parsed.account.planType || "";
          result.structure = parsed.account.structure || "";
        }
        var token = parsed.accessToken;
        if (token) {
          var jwtPayload = decodeJwt(token);
          if (jwtPayload) {
            mergeJwtPayload(result, jwtPayload);
          }
        }
        return result;
      }
    } catch (e) {
      // not JSON
    }

    var jwtPayload = decodeJwt(input);
    if (jwtPayload) {
      mergeJwtPayload(result, jwtPayload);
      return result;
    }

    return null;
  }

  function updateSessionSummary() {
    if (!sessionInput) return;
    var val = sessionInput.value.trim();
    if (!val) {
      if (sessionSummaryBox) sessionSummaryBox.hidden = true;
      if (sessionSubmit.disabled) {
        sessionSubmit.disabled = false;
        setCdkResult("ok", "fa-circle-check", lastCdkSuccessMsg || "CDK hợp lệ.");
      }
      return;
    }

    var data = parseSessionData(val);
    if (data && (data.name || data.email || data.planType || data.structure)) {
      if (summaryName) summaryName.textContent = data.name || "Không tìm thấy";
      if (summaryEmail) summaryEmail.textContent = data.email || "Không tìm thấy";
      
      var isPlusOrPro = false;
      if (summaryPlan) {
        var plan = data.planType || "free";
        summaryPlan.textContent = plan === "free" ? "Miễn phí (Free)" : plan.toUpperCase();
        if (plan.toLowerCase() === "plus" || plan.toLowerCase() === "pro") {
          summaryPlan.style.color = "var(--accent-2)";
          isPlusOrPro = true;
        } else {
          summaryPlan.style.color = "var(--ink)";
        }
      }
      if (summaryStructure) {
        var struct = data.structure || "personal";
        summaryStructure.textContent = struct === "personal" ? "Cá nhân (Personal)" : struct;
      }
      if (sessionSummaryBox) sessionSummaryBox.hidden = false;

      if (isPlusOrPro) {
        sessionSubmit.disabled = true;
        setCdkResult("err", "fa-triangle-exclamation", "Tài khoản của bạn đã là gói " + data.planType.toUpperCase() + ". CDK nâng cấp chỉ dành cho tài khoản chưa từng đăng ký Plus.");
      } else {
        sessionSubmit.disabled = false;
        setCdkResult("ok", "fa-circle-check", lastCdkSuccessMsg || "CDK hợp lệ. Hãy tiếp tục bước kích hoạt.");
      }
    } else {
      if (sessionSummaryBox) sessionSummaryBox.hidden = true;
      if (sessionSubmit.disabled) {
        sessionSubmit.disabled = false;
        setCdkResult("ok", "fa-circle-check", lastCdkSuccessMsg || "CDK hợp lệ.");
      }
    }
  }

  if (sessionInput) {
    sessionInput.addEventListener("input", updateSessionSummary);
  }

  function resetSessionSubmitButton() {
    if (sessionSubmit) {
      sessionSubmit.disabled = false;
      sessionSubmit.innerHTML = '<i class="fa-solid fa-bolt"></i> Kích hoạt ngay';
    }
  }

  function pollStatus(orderId, displayId, email) {
    var pollInterval = 3000;
    var maxAttempts = 1200; // 1 hour timeout limit
    var attempts = 0;

    var timer = setInterval(async function () {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(timer);
        setCdkResult("err", "fa-triangle-exclamation", "Quá thời gian chờ đồng bộ kích hoạt. Vui lòng liên hệ Telegram bot với mã đơn: " + displayId);
        resetSessionSubmitButton();
        return;
      }

      try {
        var data;
        if (isLocalTest) {
          await new Promise(function (resolve) { setTimeout(resolve, 500); });
          if (attempts >= 4) {
            data = {
              ok: true,
              status: "paid",
              email: email || "menchyanaalu+ruthlmx@gmail.com",
              display_id: displayId
            };
          } else {
            data = {
              ok: true,
              status: "processing",
              email: email || "menchyanaalu+ruthlmx@gmail.com",
              display_id: displayId
            };
          }
        } else {
          var response = await fetch(CODE_STATUS_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: encryptPayload({ order_id: orderId })
          });
          data = await response.json();
        }

        if (data.ok) {
          if (data.status === "paid") {
            clearInterval(timer);
            var successEmail = data.email || email;
            var successText = "Chúc mừng! ChatGPT Plus đã được kích hoạt thành công cho tài khoản <strong>" + successEmail + "</strong>! Đơn hàng " + displayId + " hoàn tất.<br>" +
                              "<span style='display: block; margin-top: 0.6rem; font-size: 0.8rem; color: #b9f7ce; opacity: 0.92; line-height: 1.4;'>" +
                              "⏳ Sau khi hệ thống báo kích hoạt thành công, OpenAI thường cần thêm từ 1–5 phút để đồng bộ hóa dữ liệu. " +
                              "Nếu logo Plus chưa xuất hiện ngay sau khi bạn tải lại chatgpt.com, vui lòng kiên nhẫn đợi vài phút rồi tải lại trang nhé!" +
                              "</span>";
            setCdkResult("ok", "fa-circle-check", successText);
            sessionInput.value = "";
            if (sessionSummaryBox) sessionSummaryBox.hidden = true;
            resetSessionSubmitButton();
          } else if (data.status === "processing") {
            setCdkResult("ok", "fa-circle-notch fa-spin", "Đang tiến hành kích hoạt Plus cho " + (data.email || email) + "... Trạng thái: Đang xử lý (Mã đơn: " + displayId + ", kiểm tra lần " + attempts + "). Quá trình này có thể kéo dài từ 1 đến 30 phút, vui lòng giữ tab này mở.");
          } else {
            clearInterval(timer);
            setCdkResult("err", "fa-circle-xmark", "Đơn kích hoạt thất bại. Trạng thái: " + (data.status || "lỗi") + ". Mã đơn: " + displayId);
            resetSessionSubmitButton();
          }
        } else {
          clearInterval(timer);
          setCdkResult("err", "fa-circle-xmark", data.msg || "Kích hoạt thất bại. Mã đơn: " + displayId);
          resetSessionSubmitButton();
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          clearInterval(timer);
          setCdkResult("err", "fa-wifi", "Lỗi kết nối mạng khi kiểm tra trạng thái (Chi tiết: " + (error.message || error) + "). Mã đơn: " + displayId);
          resetSessionSubmitButton();
        }
      }
    }, pollInterval);
  }

  var episodes = Array.prototype.slice.call(document.querySelectorAll(".episode"));
  var speed = document.getElementById("speedVal");
  function runEpisodes() {
    episodes.forEach(function (row) {
      row.querySelector("i").style.width = "0%";
      row.querySelector("b").textContent = "0%";
    });
    episodes.forEach(function (row, index) {
      var percent = 0;
      setTimeout(function () {
        var timer = setInterval(function () {
          percent = Math.min(100, percent + Math.random() * 9 + 5);
          row.querySelector("i").style.width = percent + "%";
          row.querySelector("b").textContent = Math.round(percent) + "%";
          if (percent >= 100) clearInterval(timer);
        }, 90);
      }, index * 240);
    });
  }
  if (!reduce) {
    setTimeout(runEpisodes, 700);
    setInterval(runEpisodes, 6500);
    setInterval(function () {
      speed.textContent = (Math.random() * 20 + 80).toFixed(1);
    }, 700);
  } else {
    episodes.forEach(function (row) {
      row.querySelector("i").style.width = "100%";
      row.querySelector("b").textContent = "100%";
    });
  }

  // Disables console logging in production to prevent inspecting variables
  if (!isLocalTest) {
    var noop = function () {};
    window.console = {
      log: noop,
      warn: noop,
      error: noop,
      info: noop,
      debug: noop,
      clear: noop
    };
  }

  // Anti-F12 & keyboard lock
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  }, false);

  document.addEventListener('keydown', function (e) {
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
      e.preventDefault();
      return false;
    }
    if (e.metaKey && e.altKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
      e.preventDefault();
      return false;
    }
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
  }, false);

  // Severe DevTools detection & anti-debugger
  var devtoolsOpen = false;
  var threshold = 160;
  
  // Custom UI overlay to disable page interaction
  var lockOverlay = document.createElement("div");
  lockOverlay.style.position = "fixed";
  lockOverlay.style.top = "0";
  lockOverlay.style.left = "0";
  lockOverlay.style.width = "100%";
  lockOverlay.style.height = "100%";
  lockOverlay.style.backgroundColor = "rgba(10,10,10,0.98)";
  lockOverlay.style.color = "var(--err, #ff5e7a)";
  lockOverlay.style.zIndex = "999999";
  lockOverlay.style.display = "flex";
  lockOverlay.style.flexDirection = "column";
  lockOverlay.style.alignItems = "center";
  lockOverlay.style.justifyContent = "center";
  lockOverlay.style.fontFamily = "var(--display, sans-serif)";
  lockOverlay.style.textAlign = "center";
  lockOverlay.style.padding = "2rem";
  lockOverlay.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="font-size: 4rem; margin-bottom: 1.5rem; color: var(--accent, #ff2d2d);"></i>' +
                          '<h1 id="lockTitle" style="font-size: 1.8rem; font-weight: 800; margin-bottom: 1rem; color: #fff;">PHÁT HIỆN DEVTOOLS</h1>' +
                          '<p id="lockMsg" style="max-width: 500px; color: var(--ink-dim, #a8a89e); line-height: 1.6; font-size: 0.95rem;">' +
                          'Vui lòng đóng công cụ nhà phát triển (DevTools / F12) và tải lại trang để tiếp tục sử dụng dịch vụ kích hoạt CDK.' +
                          '</p>';

  function lockPage(title, message) {
    if (title && message) {
      var tEl = lockOverlay.querySelector("#lockTitle");
      var mEl = lockOverlay.querySelector("#lockMsg");
      if (tEl) tEl.textContent = title;
      if (mEl) mEl.textContent = message;
    }
    if (!document.body.contains(lockOverlay)) {
      document.body.appendChild(lockOverlay);
      document.body.style.overflow = "hidden";
    }
  }

  // Bot, Crawler, Headless Browser detection
  function detectBot() {
    if (isLocalTest) return false;

    // 1. Check navigator.webdriver (strictly check if it is explicitly true)
    if (navigator.webdriver === true) {
      return true;
    }

    // 2. Check for automation library signatures
    var botVariables = [
      '__webdriver_evaluate', '__selenium_evaluate', '__webdriver_script_fn',
      '__webdriver_unwrapped', '_selenium', '_phantom', 'callPhantom', 'phantom'
    ];
    for (var i = 0; i < botVariables.length; i++) {
      if (window[botVariables[i]] || document[botVariables[i]]) {
        return true;
      }
    }

    // 3. User-Agent checking (only block obvious bots/scrapers)
    var ua = navigator.userAgent.toLowerCase();
    var botWords = [
      'headlesschrome', 'googlebot', 'bingbot', 'yandexbot', 'ahrefsbot',
      'baiduspider', 'facebookexternalhit', 'twitterbot', 'rogerbot', 
      'linkedinbot', 'embedly', 'quora link preview', 'showyoubot', 
      'outbrain', 'pinterest/0.', 'developers.google.com/+/web/snippet',
      'slackbot', 'vkshare', 'w3c_validator', 'redditbot', 'applebot',
      'semrushbot', 'mj12bot', 'screaming frog', 'semrush'
    ];
    for (var j = 0; j < botWords.length; j++) {
      if (ua.indexOf(botWords[j]) !== -1) {
        return true;
      }
    }

    return false;
  }

  // Lock page immediately if bot/crawler is detected
  if (detectBot()) {
    lockPage("TRUY CẬP BỊ TỪ CHỐI", "Hệ thống phát hiện hành vi tự động hoặc công cụ thu thập dữ liệu (Crawler/Bot). Vui lòng sử dụng trình duyệt tiêu chuẩn để truy cập.");
  }

  // Detect using timing anomalies (debugger statement slows down execution when DevTools is active)
  setInterval(function () {
    var startTime = performance.now();
    (function () {
      debugger;
    })();
    var endTime = performance.now();
    if (endTime - startTime > threshold) {
      devtoolsOpen = true;
      lockPage("PHÁT HIỆN DEVTOOLS", "Vui lòng đóng công cụ nhà phát triển (DevTools / F12) và tải lại trang để tiếp tục sử dụng dịch vụ kích hoạt CDK.");
    }
  }, 200);

  // Secondary outerHeight/innerWidth detection
  setInterval(function() {
    var widthThreshold = window.outerWidth - window.innerWidth > threshold;
    var heightThreshold = window.outerHeight - window.innerHeight > threshold;
    if (widthThreshold || heightThreshold) {
      devtoolsOpen = true;
      lockPage("PHÁT HIỆN DEVTOOLS", "Vui lòng đóng công cụ nhà phát triển (DevTools / F12) và tải lại trang để tiếp tục sử dụng dịch vụ kích hoạt CDK.");
    }
  }, 500);
})();
