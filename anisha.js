import { if_then, mounted, mem, mut, eff_on, render, sig_set as sig, h } from "./lib/tapri/monke.js"
import { hdom } from "./lib/tapri/hdom/index.js"
import { THREE, addons } from "./lib/threejs/three.js"
import { Keymanager } from "./lib/keymanager.js"

versions.data().then((res) => console.log(res))

const M = mut({
  fn: {},
  eff_on: [],
  off: {
    x: 0,
    y: -10,
    z: -.1,
  }
})

document.M = M
let ws = new WebSocket("ws://localhost:8881/data")

ws.onopen = () => {
  console.log("connected")
}

let cursor_x = sig(0)
let cursor_y = sig(0)
let press = sig(false)

let cursor_move_x = (val) => {
  // check if within bounds
  if (cursor_x() + val < window.innerWidth
    && cursor_x() + val > 0
  ) cursor_x.set(cursor_x() + val)
}

let cursor_move_y = (val) => {
  // check if within bounds
  if (cursor_y() + val < window.innerHeight
    && cursor_y() + val > 0
  ) cursor_y.set(cursor_y() + val)
}

let scale = 20

function updatedata(data) {
  console.log("getting", data)
  press.set(data.pressed)

  if (data.x > 580 && data.x < 900) {
    cursor_move_x(scale / 2)
  }

  if (data.x < 500 && data.x > 150) {
    cursor_move_x(-scale / 2)
  }

  if (data.x > 900) {
    cursor_move_x(scale)
  }

  if (data.x < 50) {
    cursor_move_x(-scale)
  }

  if (data.y > 900) {
    cursor_move_y(scale)
  }

  if (data.y < 50) {
    cursor_move_y(-scale)
  }
}

versions.socket(updatedata)
ws.onmessage = (e) => {
  let data = JSON.parse(e.data)
  console.log(data.pressed)
  updatedata(data)
}


// basic styling
let style = document.createElement("style")
style.innerText = `*{padding: 0;margin:0}`
document.head.appendChild(style)

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

function initTHREE() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.querySelector("#THREE")?.appendChild(renderer.domElement);
  animate()
}

camera.position.z = 3.3;

let keys = new Keymanager()
keys.on("ArrowUp", () => camera.position.z -= 2)
keys.on("ArrowDown", () => camera.position.z += 2)

window.addEventListener("keydown", (e) => keys.event(e))
let old_x = 0
let old_y = 0

const lerp = (x, y, a) => x * (1 - a) + y * a;

function animate(d) {
  requestAnimationFrame(animate)
  old_x = lerp(old_x, cursor_x(), .01)
  old_y = lerp(old_y, cursor_y(), .01)

  camera.position.x = ((old_x / window.innerWidth) - .5) / 2
  camera.position.y = ((old_y / window.innerWidth) - .5) / 2

  camera.lookAt(0, 0, 0)

  renderer.render(scene, camera);
  //c.update()
}


let css = mut([`
 button.option {
    border: 1px solid white;
    background: #222a;
    color: white;
    font-size: 1.9em;
    font-family: hermit;
    min-width: 200px;
    text-transform: uppercase;
    padding: .5em;
    margin-right: 3em;
 }

 button.selected.option {
    background: white;
    color: black;
 }
 
 button.option:hover {
    background: white;
    color: black;
    cursor: crosshair;
 }
`])

let css_str = mem(() => css.join(`\n`))
let current = sig(0)
let selected = sig(null)

let fns = () => cursor_x() && cursor_y()
const play_fn = (i) => () => {
  decision_tree.forEach(n => {
    n.controller?.focus(false)
    n.controller?.pause()
  })

  current.set(i)
  decision_tree[i].controller?.play()
}

setTimeout(() => play_fn(12)(), 100)

const Root = () => {
  setTimeout(() => {
    decision_tree.forEach(n => {
      n.controller?.focus(false)
      n.controller?.pause()
    })
  }, 5)

  mounted(initTHREE)
  let style = `
    all: unset;
    color: white;
    font-family: monospace;
    border: 1px dotted #fff8;
    padding: .5em;
  `


  let button = [
    ...decision_tree.map((node, i) => [
      "button",
      { style, onclick: play_fn(i) },
      node.src
    ])]


  let debug = sig(false)
  let current_node = mem(() => decision_tree[current()])
  let options = mem(() => current_node()?.options)
  let next_btns = mem(() => options().map((opt, i) =>
    hdom(["button"
      , {
        class: mem(() => {
          console.log("running!")
          return `option ${i == selected() ? "selected" : ""}`
        }),
        index: i,
        onclick: play_fn(opt.next)
      },
      opt.text])))

  let cursor_style = mem(() => `
    width: 20px;
    height: 20px;
    position: fixed;
    top: ${cursor_y()}px;
    left: ${cursor_x()}px;
    background-color: ${options()?.length > 0 ? "yellow" : "#ff01"};
  `)

  eff_on(press, () => {
    if (press()) {
      console.log("PRESSED")
      let selected_option = options()[selected()]
      if (selected_option) {
        play_fn(selected_option.next)()
      }
    }
  })

  eff_on(fns, () => {
    let found = null
    document.querySelectorAll("button.option")
      .forEach((el) => {
        let { x, y, width, height } = el.getBoundingClientRect();
        console.log(el, x)
        if (
          // x position
          cursor_x() > x && cursor_x() < x + width
          &&
          // y position
          cursor_y() > y && cursor_y() < y + height
        ) {
          console.log("intersection!", el.getAttribute("index"))
          found = parseInt(el.getAttribute("index"))
        }
      })

    selected.set(found)
    console.log("selected", selected())
  })

  let s = `filter: saturate(1);`

  let container = `
    position: fixed;
    bottom: 2em;
    left: 5em;
  `

  let dec = `
  position: fixed;
  bottom: 3em;
  left: 0;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  `

  let d = hdom(["#debug", DebugDom,
    ["#container", { style: container }, button]],)

  let three = () =>
    hdom(["#THREE", { style: s },
      ["#decisions", { style: dec }, next_btns],
      ["button", {
        style: "position:fixed",
        onclick: () => debug.set(!debug())
      }, "debug"],
      //mem(() => debug() ? d() : "")
    ])

  return hdom(
    ["div",
      ["style", css_str],
      [".main", three],
      [".cursor", { style: cursor_style }]
    ]
  )
}


/**
@typedef {{
  text: string,
  next: number,
  start: number,
}} Decision 

@typedef {{
  text: string,
  start: number,
  end: number,
}} Subtitle
*/

/**
@typedef {{
  src: string,
  options: Decision[],
  subtitles: Subtitle[],
  auto?: number,
  controller: (null | {
    play: () => void,
    pause: () => void,
    seek: (num: number) => void,
    focus: (to_focus: boolean) => void
  })
}} SourceNode 
*/

/**
@type {SourceNode[]}
*/

let decision_tree = await versions.data().then(res => JSON.parse(res))

/**
@description make sure video is loaded
@param {HTMLVideoElement} video 
*/
function create_video_plane(video) {
  // make a video element
  // video will always be 4:3
  // make plane that size
  const texture = new THREE.VideoTexture(video)

  const geometry = new THREE.PlaneGeometry(8, 6)

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    // opacity: .2,
    // transparent: true,
    // use texture of video
  })
  const plane = new THREE.Mesh(geometry, material);

  return plane
}

/* -------------------
.debug div
<(cur)>
------------------------
.main-frame
[ video     ][ options ]
[           ][         ]
[           ][         ]
---------------------
.bottom
[  timeline ][subtitles]

---------------------*/
css.push(`
  #debug{
    position: fixed;
    top: 1em;
    left: 1em;
    width: 60vw;
    height: 85vh;
    border: 1px dotted white;
    background-color: #000;
  }

  .pad {
    padding: .5em;
  }
  
  .debug-div {
    font-family: monospace;
    color: white;
    padding: 10px;
  }

  .debug-div button{
    all: unset;
    border: 1px solid white;
    cursor: crosshair;
    padding: .2em;
  }
  
  .debug-div button:hover {
    background-color: white;
    color: black;
  }

  .main-frame{
    display: grid;
    grid-template-columns: 60% 40%; 
    position: relative;
  }

  .options-preview {
    padding: .5em;
    border: 1px solid #fff8;
  }

  .options-menu {
    background: black;
    position: absolute;
    top: 2em;
    left: 2em;
    width: 85%;
  }

  .options-grid {
    padding: 2em;
    display: grid;
    grid-template-columns: repeat(auto-fit, 150px);
    grid-gap: 1em;
  }

  .options-btn {
    padding: 1em;
    border: .5px solid #fff4;
  }
  
  .options-btn:hover{
    background: white;
    color: black;
    cursor: pointer;
  }

  .bottom {
    width: 98%;
    display: grid;
    grid-template-rows: 30% 80%;
    overflow: hidden;
  }

  .bottom .timeline-container {
    overflow-x: scroll;
    border: 1px solid white;
  }

  video {
    max-width: 100%;
  }

  .auto-video {
    width: 100px;
    border: 1px yellow solid;
  }
  
`
)

function DebugDom() {
  let dt = mut(decision_tree)
  let parent = "./fs/media/anisha-thesis/"
  let cur = sig(0)
  let showing_options = sig(false)

  let next = () => {
    cur() + 1 >= dt.length
      ? cur.set(0)
      : cur.set(cur() + 1)
  }

  let prev = () => {
    cur() <= 0
      ? cur.set(dt.length - 1)
      : cur.set(cur() - 1)
  }

  let src_on = (i) => parent + dt[i]?.src
  let cur_src = mem(() => src_on(cur()))
  let cur_options = mem(() => dt[cur()]?.options)

  let add_to_cur = (text, next) => {
    hide_options()
    dt[cur()].options.push({ text, next })
  }

  let set_text = (text, i) => {
    dt[cur()].options[i].text = text
  }

  let add_auto = (next) => {
    hide_options()
    dt[cur()].auto = next
  }

  let remove_auto = () => {
    dt[cur()].auto = null
  }

  let show_options = () => {
    showing_options.set(true)
  }

  let show_auto = () => {
    auto_select.set(true)
    show_options()
  }

  let hide_options = () => {
    showing_options.set(false)
    auto_select.set(false)
  }

  let remove_cur_option = (i) => {
    dt[cur()].options.splice(i, 1)
  }


  let video_style = `width:80%;`
  let video_smol = `width: 85px;`

  let options = hdom(
    [".options-menu",
      { onclick: hide_options },
      [".options-grid", dt.map((node, i) =>
        [".options-btn", {
          onclick: () => {
            if (auto_select()) {
              add_auto(i)
            }
            else {
              add_to_cur("something", i)
            }
          }
        }, node.src])]])

  const options_btn =
    (option, i) => {
      let input = sig(option.text)

      return hdom([
        ".options-preview",
        ["button", { onclick: () => remove_cur_option(i) }, "xx"],
        ["video", {
          src: src_on(option.next),
          style: video_smol,
          controls: true
        }],

        ["p.src", dt[option.next].src],
        ["input", { value: input, oninput: (e) => input.set(e.target.value) }],
        ["button", { onclick: () => set_text(input(), i) }, "save"],
      ])
    }

  let save = () => {
    // save to anisha_thesis_timeline_data.json
    const body = {
      content: JSON.stringify(dt, null, 2),
    };

    let path = "data/anisha_thesis_timeline_data.json"

    fetch("/fs/" + path, {
      headers: { "Content-Type": "application/json" },
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  let auto_select = sig(false)
  let duration = sig(1)
  let current_time = sig(0)
  let scale = sig(200)
  let time_to_px = (s) => s * scale()
  let timeline_style = mem(() => `
    position: relative;
    width: ${time_to_px(duration())}px;
    height: 100px;
  `)

  let seek_style = mem(() => `
    position: absolute;
    left: ${time_to_px(current_time())}px;
    height: 80%; 
    width: 1px;
    background-color: yellow;
  `)

  let video_ref = (viddy) => {
    viddy.ondurationchange = (eve) => {
      console.log("duration changed", eve)
      console.log("duration:::>", viddy.duration)
      duration.set(viddy.duration)
    }

    viddy.ontimeupdate = (e) => {
      console.log("time updated", viddy.currentTime)
      current_time.set(viddy.currentTime)
    }
  }

  let auto =
    [".auto",
      mem(() =>
        dt[cur()].auto != undefined
          ? hdom(
            [".auto-video",
              ["video", { src: src_on(dt[cur()].auto) }],
              ["p", dt[dt[cur()].auto].src]
            ])
          : "no-auto"),
      ["button", { onclick: show_auto }, "add auto"],
      ["button", { onclick: remove_auto }, "x del x"],
    ]


  let main_frame = [
    ".main-frame",
    ["video", { src: cur_src, style: video_style, controls: true, ref: video_ref }],
    [".next", mem(() => cur_options()?.map(options_btn)),
      auto,
      ["button", { onclick: show_options }, "add"]
    ]
  ]

  let timeline =
    [".bottom",
      [".timeline-container",
        [".timeline", { style: timeline_style }, [".seeker", { style: seek_style }]]],
      [".subtitle-container",
        ["button", "add subtitle"]]]

  let r = () => hdom(
    [".debug-div",
      [".title", mem(() => dt[cur()].src)],
      ["button", { onclick: save }, "save"],
      // next prev
      ["div",
        ["button", { onclick: prev }, "prev"],
        ["span.pad", cur],
        ["button", { onclick: next }, "next"],
      ],
      main_frame,
      timeline,
      () => if_then([showing_options(), options])
    ])

  return r
}

let root = "./fs/media/anisha-thesis/"

decision_tree.forEach((node, i) => {
  let viddy = document.createElement("video")
  viddy.src = root + node.src
  viddy.autoplay = true
  let f = create_video_plane(viddy)
  f.position.x = 0
  scene.add(f)

  viddy.onended = (e) => {
    pause()
    console.log("ended", node.src)
    console.log("auto for", node.src, "is", node.auto)

    if (node.auto != undefined) {
      // check if it is in focus...
      if (i != current()) {
        console.log(node.src, "not in focus, returning")
        return
      }

      current.set(node.auto)
      decision_tree[node.auto].controller.play()
      console.log("playing", decision_tree[node.auto].src)
    }
  }

  if (node.src.includes("OP")) {
    viddy.loop = true
  }

  let pause = () => {
    viddy.pause()
  }

  let play = () => {
    console.log("playing", node.src)
    node.controller?.focus(true)
    viddy.currentTime = 0
    viddy.play();
    viddy.volume = 1;
    viddy.playbackRate = 1
  }

  node.controller = {
    viddy,
    // on play check if there is an auto, and play that too so autplay works
    play,
    pause,
    seek: (t) => viddy.currentTime = t,
    focus: (bool) => {
      if (bool) {
        console.log("focusing", node.src)
        f.position.x = 0
        f.position.z = 0
      } else {
        // calculate position based on some logic...
        f.position.x = 12 + i * 2
        f.position.z = -((i + 1) / 10)
      }
    }
  }
})

render(Root, document.body)






















































