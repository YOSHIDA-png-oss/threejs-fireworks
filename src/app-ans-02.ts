import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 24fi123　吉田広暁

class ThreeJSContainer {
    private scene!: THREE.Scene;
    // private geometry!: THREE.BufferGeometry;
    // private material!: THREE.Material;
    private cube!: THREE.Mesh;
    private light!: THREE.Light;

    constructor() {

    }

    // 画面部分の作成(表示する枠ごとに)*
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x495ed));

        //カメラの設定
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const orbitControls = new OrbitControls(camera, renderer.domElement);

        this.createScene();
        // 毎フレームのupdateを呼んで，render
        // reqestAnimationFrame により次フレームを呼ぶ
        const render: FrameRequestCallback = (_time) => {
            orbitControls.update();

            renderer.render(this.scene, camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    }

    // シーンの作成(全体で1回)
    private createScene = () => {
        this.scene = new THREE.Scene();
        

         const addRandomObject = () =>{
            const randval = Math.floor(Math.random() * 3);

            let geometry: THREE.BufferGeometry = new THREE.BoxGeometry();;
            const size: number = Math.random() * 1.0 + 0.25;

            switch (randval) {
                case 0:
                    geometry = new THREE.CylinderGeometry(size, size, size, 32, 1, false, Math.PI);
                break;

                case 1:
                    geometry = new THREE.BoxGeometry(size, size, size);
                break;
                
                case 2:
                    geometry = new THREE.SphereGeometry(size, 32, 16, 0, 2 * Math.PI, 0, Math.PI);
                break;    
    }
            
             const meshMaterial: THREE.Material = new THREE.MeshNormalMaterial({side:THREE.DoubleSide});
             const addObject: THREE.Mesh = new THREE.Mesh(geometry, meshMaterial);
             addObject.position.x = Math.round((Math.random() * 5)) - 2.5;
             addObject.position.y = Math.round((Math.random() * 5)) - 2.5;
             addObject.position.z = Math.round((Math.random() * 5)) - 2.5;
             this.scene.add(addObject);
         }
        for(let i = 0; i < 30; i++) {
            addRandomObject();
        }
        
    
        //ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        // 毎フレームのupdateを呼んで，更新
        // reqestAnimationFrame により次フレームを呼ぶ
        const update: FrameRequestCallback = (_time) => {
            this.cube.rotateX(0.1);

            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    const container = new ThreeJSContainer();

    const viewport = container.createRendererDOM(640, 480, new THREE.Vector3(-3, 3, 3));
    document.body.appendChild(viewport);
}
