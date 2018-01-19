import React from 'react';
import $ from 'jquery';

import Sizes from './Sizes.jsx';
import Crusts from './Crusts.jsx';
import Toppings from './Toppings.jsx';
import OrderSummary from './OrderSummary.jsx';
import PizzaPicture from './PizzaPicture.jsx';
import ProgressBar from './ProgressBar.jsx';
import OrderAPI from './OrderAPI.jsx';

class Pizza extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      size: {},
      crust: {},
      toppings: [],
      friendUserData: {},
      friendToppings: [],
      friendUsername: null,
      subtotal: 0,
      currentStep: 0,
      numberOfUsers: this.props.numberOfUsers
    };

    this.onSizeChange = this.onSizeChange.bind(this);
    this.onCrustChange = this.onCrustChange.bind(this);
    this.onToppingChange = this.onToppingChange.bind(this);
    this.countTotal = this.countTotal.bind(this);
    this.submitOrder = this.submitOrder.bind(this);
    this.nextOption = this.nextOption.bind(this);
    this.backOption = this.backOption.bind(this);

    this.props.socket.on('changeStep', function(step) {
      changeStep(step);
    });

    const changeStep = step => {
      this.setState({
        currentStep: step
      });
    }

    this.props.socket.on('friendChangedToppings', function(toppings, friendUsername) {
      setNewFriendsToppings(toppings);
      setFriendUsername(friendUsername);
    });

    const setFriendUsername = (friendUsername) => {
      this.setState({friendUsername: friendUsername});
    }

    const setNewFriendsToppings = toppings => {
      this.setState({friendToppings: Object.values(toppings)}, function () {
        this.countTotal();
      });
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.numberOfUsers !== this.state.numberOfUsers) {
      this.setState({
        numberOfUsers: nextProps.numberOfUsers
      });
    }
  }

  onSizeChange(size) {
    this.setState({size: size}, function() {
      this.countTotal();
    });
  }

  onCrustChange(crust) {
    this.setState({crust: crust}, function() {
      this.countTotal();
    });
  }

  onToppingChange(toppings) {
    this.setState({
      toppings: Object.values(toppings)
    }, function() {
      this.countTotal();
    });
  }

  countTotal() {
    var total = 0;
    total += this.state.size.price;
    total += this.state.crust.price;
    var toppingPrice = 0;
    for(var topping of this.state.toppings) {
      toppingPrice += topping.price;
    }
    if(this.state.numberOfUsers === 2) {
      toppingPrice = toppingPrice * 0.5;
      for (var friendTopping of this.state.friendToppings) {
        toppingPrice += friendTopping.price * 0.5;
      }
    }
    total += toppingPrice;
    this.setState({subtotal: total});
  }

  nextOption() {
    console.log('next called');
    this.setState(((prevState) => (prevState.currentStep < 3) ? {currentStep: prevState.currentStep + 1} : null), function() {
      this.props.socket.emit('setStep', this.state.currentStep);
    });
  }

  backOption() {
    this.setState(((prevState) => (prevState.currentStep >= 1) ? {currentStep: prevState.currentStep - 1} : null), function() {
      this.props.socket.emit('setStep', this.state.currentStep);
    });
  }

  submitOrder() {
    this.saveOrder();
    // this.submitOrder();
  }

  saveOrder() {
    var datum = {size: this.state.size, crust: this.state.crust, toppings: this.state.toppings, price: this.state.subtotal};
    console.log('The order about to be saved is ', datum);
    $.ajax({
      url: '/save',
      method: 'POST',
      data: JSON.stringify(datum),
      contentType: 'application/json',
      sucess: function(data) {
        console.log('data', data);
      },
      error: function(err) {
        console.log(err);
      }
    });
  }

  submitToAPIOrder() {
    OrderAPI.submitOrder();
    console.log('Pizza:submitOrder');
  }

  render() {
    // let currentOptionComponent = null;
    // if (this.state.currentStep === 0) {
    //   currentOptionComponent = <Sizes onSizeChange={this.onSizeChange} socket={this.props.socket} roomID={this.props.roomID} />;
    // } else if (this.state.currentStep === 1) {
    //   currentOptionComponent = <Crusts onCrustChange={this.onCrustChange} socket={this.props.socket} roomID={this.props.roomID} />;
    // } else if (this.state.currentStep === 2) {
    //   currentOptionComponent = <Toppings onToppingChange={this.onToppingChange} socket={this.props.socket} roomID={this.props.roomID}/>;
    // }

    return (
      <div id="pizza">
        <OrderAPI />

        <ProgressBar currentStep={this.state.currentStep}
                     nextOption={this.nextOption}
                     backOption={this.backOption}
                     />

        <div id="options">
          <h1>Pizza Options</h1>
          <Sizes onSizeChange={this.onSizeChange}
                 socket={this.props.socket}
                 roomID={this.props.roomID}
                 currentStep={this.state.currentStep}
                 />
          <Crusts onCrustChange={this.onCrustChange}
                  socket={this.props.socket}
                  roomID={this.props.roomID}
                  currentStep={this.state.currentStep}
                  />
          <Toppings onToppingChange={this.onToppingChange}
                    socket={this.props.socket}
                    roomID={this.props.roomID}
                    currentStep={this.state.currentStep}
                    />
        </div>

        <PizzaPicture size={this.state.size.name}
                      crust={this.state.crust.name}
                      toppings={this.state.toppings}
                      />

        <OrderSummary size={this.state.size.name}
                      crust={this.state.crust.name}
                      toppings={this.state.toppings}
                      friendToppings={this.state.friendToppings}
                      subtotal={this.state.subtotal}
                      numberOfUsers={this.state.numberOfUsers}
                      socket={this.props.socket}
                      friendUsername={this.state.friendUsername}
                      />

        <div id="submitButton">
          <button onClick={this.submitOrder}>Submit</button>
        </div>
      </div>
    );
  }
}

export default Pizza;
