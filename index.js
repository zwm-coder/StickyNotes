/**
 * @zwm
 * */

// 名字空间模块
var app = {
    util: {},
    store:{}
};

// 工具方法模块
app.util = {
    $: function (selector, node) {
        return (node || document).querySelector(selector);
    },
    formatTime: function (ms) {
        var d = new Date(ms);
        var pad = function (s) {
            if (s.toString().length === 1) {
                return '0' + s;
            }
            return s;
        }

        var year = d.getFullYear();
        var month = d.getMonth() + 1;
        var date = d.getDay();

        var hour = d.getHours();
        var minute = d.getMinutes();
        var second = d.getSeconds();

        return year + '-' + pad(month) + '-' + pad(date) + ' ' + pad(hour) + ':' + pad(minute) + ':' + pad(second);
    }
};


// store模块
app.store = {
    __store_key: '__sticky_note',
  get: function (id) {
      var notes = this.getNotes();
      return notes[id] || {};
  },
  set: function (id, value) {
      console.log(id);
      var notes = this.getNotes();
      // console.log(notes);
      notes[id] = value;
     this.store(notes);
  },
  getNotes: function () {
      var data = localStorage[this.__store_key] || '{}';
      // debugger
      return JSON.parse(data);
  },
  store: function (notes) {
      localStorage[this.__store_key] = JSON.stringify(notes);
  },
  clear: function () {
      localStorage[this.__store_key] = JSON.stringify({});
  }
};


(function (util, store) {
    var $ = util.$;
    var moveNote = null;
    var startX;
    var startY;
    var maxIndex = 0;

    var noteTpl = `
        <i class="u-close"></i>
        <div class="u-editor" contenteditable="true"></div>
        <div class="u-timestamp">
            <span>更新：</span>
            <span class="time">2017-06-14 20：11：30</span>
        </div>
    `;

    function Note(options) {
        var note = document.createElement('div');
        note.className = 'm-note';
        note.innerHTML = noteTpl;
        note.id = options.id || (Date.parse(new Date()) / 1000).toString();   // 以时间戳作为id
        note.style.left = options.left + 'px';
        note.style.top = options.top + 'px';
        note.style.zIndex = options.zIndex;
        $('#content').appendChild(note);
        $('.u-editor', note).innerHTML = options.content || '';
        this.note = note;
        this.addEvent();
        this.updateTime(options.time || null);
    }

    Note.prototype.close = function () {
        // console.log("close");
        $('#content').removeChild(this.note);
    };

    Note.prototype.updateTime = function (ms) {
          var ts = $('.time', this.note);
          ms = ms || Date.now();
          ts.innerHTML = util.formatTime(ms);
    };

    Note.prototype.addEvent = function() {
        // 便签的mousedown事件
        var mousedownHandle = function (e) {
            moveNote = this.note;
            startX = e.clientX - this.note.offsetLeft;
            startY = e.clientY - this.note.offsetTop;
            if (this.note.style.zIndex !== maxIndex - 1) {
                this.note.style.zIndex = maxIndex++;
            }
        }.bind(this);
        this.note.addEventListener('mousedown', mousedownHandle);

        // 便签输入事件
        var editor = $('.u-editor', this.note);

        var inputTimer;
        var inputHandle = function(e) {
            var value = editor.innerHTML;
            clearTimeout(inputTimer);
            inputTimer = setTimeout(function () {
                store.set(this.note.id, value)
            }.bind(this), 1000);
        }.bind(this);

        editor.addEventListener('input', inputHandle);

        var closeBtn = $('.u-close', this.note);
        var closeHandler = function() {
            this.close();
            closeBtn.removeEventListener('click', closeHandler);  //在移除容器的同时也移除掉监听事件
            this.note.removeEventListener('mousedown', mousedownHandle);
            var notes = store.getNotes();
            if (notes[this.note.id]) {
                delete notes[this.note.id];
                store.store(notes);
            }
        }.bind(this);

        closeBtn.addEventListener('click',closeHandler);
        // closeBtn.addEventListener('click',this.close.bind(this));
        /**
         * 为什么要使用this.close.bind(this) ??
         * 因为如果直接使用this.close的话，则在回掉函数close中的this就是指的调用这个函数的对象，
         * 也就是我们的关闭图标，所以在回调函数中的this.note就是错误的，将close函数的环境对象绑定
         * 为note时，才是正确的。
         * */

    };

    document.addEventListener("DOMContentLoaded", function (e) {
        // 创建按钮事件
        $("#create").addEventListener('click', function (e1) {
            new Note({
                left: Math.round(Math.random() * (window.innerWidth - 220)),
                top: Math.round(Math.random() * (window.innerHeight - 320)),
                zIndex: maxIndex++
            });
        })

        // 清空按钮事件
        $("#clear").addEventListener('click', function (e) {
            store.clear();
            var content_ele = $('#content');
            // 若是点击了清空按钮，则remove所有的子元素
            if (content_ele) {
                while (content_ele.hasChildNodes()) {
                    content_ele.removeChild(content_ele.firstChild);
                }
            }
        })

        //移动监听
        var  mousemoveHandle = function(e) {
            // console.log(e);
            if (!moveNote) {
               return;
            }

            moveNote.style.left = (e.clientX - startX) + 'px';
            moveNote.style.top = (e.clientY - startY) + 'px';
        };

        var mouseupHandle = function (e) {
            moveNote = null;
        }

        document.addEventListener('mousemove', mousemoveHandle);
        document.addEventListener('mouseup', mouseupHandle);

        //初始化 notes
        var notes = store.getNotes();
        Object.keys(notes).forEach(function (id) {
            new Note({
                left: Math.round(Math.random() * (window.innerWidth - 220)),
                top: Math.round(Math.random() * (window.innerHeight - 320)),
                zIndex: maxIndex++,
                content: notes[id],
                id: id,
                time: (new Date()).setTime(Number(id) * 1000)
            })
        })
    });
})(app.util, app.store);