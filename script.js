const client = contentful.createClient({
  space: '8ffntmxaz0u2',
  environment: 'master', // defaults to 'master' if not set
  accessToken: 'Bu4Lk3B2C6ErE7nL1kbol4_jef0DMGVq36agLgAKplE'
})



// variables

const cartBtn = document.querySelector('.cart-btn');
const closeCartBtn = document.querySelector('.close-cart');
const clearCartBtn = document.querySelector('.clear-cart');
const cartDOM = document.querySelector('.cart');
const cartOverlay = document.querySelector('.cart-overlay');
const cartItems = document.querySelector('.cart-items');
const cartTotal = document.querySelector('.cart-total');
const cartContent = document.querySelector('.cart-content');
const productsDOM = document.querySelector('.products-center');

// cart
let cart = [];
//buttons
let buttonsDOM = [];

// getting the products
class Products {
    async getProducts(){
        try{
            let contentful = await client.getEntries({
                content_type: "shoppingCartJs"
            });
            // these were for local JSON data, not needed with contentful
            // let result = await fetch('products.json');
            // let data = await result.json();

            let products = contentful.items;
            products = products.map(item => {
                const {title, price} = item.fields;
                const {id} =item.sys;
                //had to format image variable this way due to JSON url format
                const image ="https:" + item.fields.image.fields.file.url;
                return {title, price, id, image};
            })
            return products;
        } catch (error) {
            console.log(error);
        }
    }
}

//display products
class UI {
    displayProducts(products) {
        let result = '';
        products.forEach(product =>{
            result +=`
            <article class="product">
                <div class="img-container">
                    <img src="${product.image}" alt="product" class="product-img">
                    <button class="bag-btn" data-id="${product.id}">
                        <i class="fa-solid fa-cart-shopping"></i>
                        add to cart
                    </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$${product.price}</h4>
            </article>`;
        });
        productsDOM.innerHTML = result;    
    }
    getBagButtons(){
        //... is a spread operator that allows you to spread the elements of an array or object
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id;
            //looks for item in cart already
            let inCart = cart.find(item => item.id === id);
            if(inCart) {
                button.innerText = "In Cart";
                button.disable = true;
            } 
            button.addEventListener("click", (event) => {
                event.target.innerText = "In Cart";
                event.target.disabled = true;
                //get product from products
                let cartItem = {...Storage.getProduct(id), amount: 1};
                //add product to the cart
                cart = [...cart, cartItem];
                //save cart in local storage
                Storage.saveCart(cart);
                //set cart values
                this.setCartValues(cart);
                //display cart item
                this.addCartItem(cartItem);
                //show the cart
                this.showCart();
            });
            
        });
    }
    setCartValues(cart){
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });
        //keeps price at 2 decimal places
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }
    addCartItem(item){
        const div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
        <img src="${item.image}" alt="product">
            <div>
                <h4>${item.title}</h4>
                <h5>$${item.price}</h5>
                <span class="remove-item" data-id=${item.id}>remove</span>
            </div>
            <div>
                <i class="fa-solid fa-chevron-up" data-id="${item.id}"></i>
                <p class="item-amount">${item.amount}</p>
                <i class="fa-solid fa-chevron-down" data-id="${item.id}"></i>
            </div>
        `;
        //adds the div just created above to the cartContent div
        cartContent.appendChild(div);
    }
    showCart(){
        cartOverlay.classList.add('transparentBcg');
        cartDOM.classList.add('showCart');
    }
    //gets cart from local storage, if it has stored content
    setupAPP(){
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener('click', this.showCart);
        closeCartBtn.addEventListener('click', this.hideCart);
    }
    populateCart(cart){
        cart.forEach(item => this.addCartItem(item));
    }
    hideCart(){
        cartOverlay.classList.remove('transparentBcg');
        cartDOM.classList.remove('showCart');
    }
    cartLogic(){
        //clear cart button
        clearCartBtn.addEventListener('click', () => {
            this.clearCart();
        });
        //removes item from cart
        cartContent.addEventListener('click', event => {
            if(event.target.classList.contains('remove-item')){
                //target what is clicked
                let removeItem = event.target;
                //get its id
                let id = removeItem.dataset.id;
                //removes entire div ('cart-items') from DOM 
                cartContent.removeChild(removeItem.parentElement.parentElement);
                //removes from cart targeting it using its id
                this.removeItem(id);
                //add additional item to cart with arrow-up
            } else if (event.target.classList.contains("fa-chevron-up")){
                let addAmount = event.target;
                let id = addAmount.dataset.id;
                //find item in cart by id (of item clicked)
                let tempItem = cart.find(item => item.id === id);
                //increase amount of item by 1
                tempItem.amount = tempItem.amount + 1;
                //update cart in local storage
                Storage.saveCart(cart);
                this.setCartValues(cart);
                //finds the <p> with total price and updates it 
                addAmount.nextElementSibling.innerText = tempItem.amount;
            } else if (event.target.classList.contains("fa-chevron-down")){
                let lowerAmount = event.target;
                console.log(lowerAmount);
                let id = lowerAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount - 1;
                if(tempItem.amount > 0){
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;
                } else {
                    cartContent.removeChild(lowerAmount.parentElement.parentElement);
                    this.removeItem(id);
                }
                
            }
        });
    }
    //cart functionality
    clearCart(){
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        while(cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0]);
        }
        this.hideCart();
    }
    removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        //updates cart total price
        this.setCartValues(cart);
        //resaves the cart
        Storage.saveCart(cart);
        //gets button used to add specific item, to reset it
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fa-solid fa-cart-shopping"></i>
                        add to cart`;
    }
    //gets button id of item removed
    getSingleButton(id){
        return buttonsDOM.find(button => button.dataset.id === id);
    }
}

//local storage (being used to store all product info on computer rather than fetching it from server as would typically be done)
class Storage {
    static saveProducts(products){
        localStorage.setItem("products", JSON.stringify(products));
    }
    static getProduct(id){
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(product => product.id === id);
    }
    static saveCart(cart){
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    static getCart(){
        return localStorage.getItem('cart')? JSON.parse(localStorage.getItem('cart')) : [];
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();
// setup app
    ui.setupAPP();

//get all products
    products.getProducts().then(products  => {
        ui.displayProducts(products)
        Storage.saveProducts(products);
    }).then(() => {
        // gets buttons after products are loaded (if called with const at top of script, products wouldnt be loaded yet so wouldnt work)
        ui.getBagButtons();
        ui.cartLogic();
    });
});