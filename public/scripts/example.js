/**
 * This file provided by Facebook is for non-commercial testing and evaluation
 * purposes only. Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */


function formatDate(date) {
  var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  var d = new Date(date),
      month = monthNames[d.getMonth()],
      day = '' + d.getDate(),
      year = d.getFullYear();

  return month + ' ' + day + ', ' + year;
}

var StarList = React.createClass({
  render: function () {
    var starNodes = [];

    for (var i = 0; i < 5; i++) {
      var displayRating = i + 1;

      var highlight = i < this.props.numStars ? 'yellow-star' : '';

      starNodes.push(<div className={"big-star rating-" + displayRating + " " + highlight} key={i}></div>);
    }

    return (
        <div className="stars-container">
          {starNodes}
          <div className="clear"></div>
        </div>
    );
  }
});

var Rating = React.createClass({
  rawMarkup: function() {
    var rawMarkup = marked(this.props.children.toString(), {sanitize: true});
    return { __html: rawMarkup };
  },

  render: function() {

    //var now = Date.now();

    var date = formatDate(this.props.postDate);

    var text = this.props.children ? <span dangerouslySetInnerHTML={this.rawMarkup()} /> : null;
    var title = this.props.title ? <h3 className='title'>{this.props.title}</h3> : null;

    var posted = this.props.postDate ? <h4>Posted on: {date.toString()}</h4> : null;

    return (
      <div className="rating">
        <div className="item-image">
          <img src={this.props.image} />
        </div>
        <div className="item-content">
          <h2 className="item-name">
            {this.props.name} <span className="item-brand">made by <a href='' >{this.props.brand}</a></span>
          </h2>

          {posted}
          <StarList numStars={this.props.numStars}></StarList>
          {title}
          {text}

        </div>
        <div className="clear"></div>
      </div>
    );
  }
});

var RatingBox = React.createClass({
  loadRatingsFromServer: function() {
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      cache: false,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  handleRatingSubmit: function(rating) {
    var ratings = this.state.data;
    // Optimistically set an id on the new rating. It will be replaced by an
    // id generated by the server. In a production application you would likely
    // not use Date.now() for this and would have a more robust system in place.
    rating.postDate = Date.now();
    var newRatings = ratings.concat([rating]);
    this.setState({data: newRatings});
    $.ajax({
      url: this.props.url,
      dataType: 'json',
      type: 'POST',
      data: rating,
      success: function(data) {
        this.setState({data: data});
      }.bind(this),
      error: function(xhr, status, err) {
        this.setState({data: ratings});
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },
  getInitialState: function() {
    return {data: []};
  },
  componentDidMount: function() {
    this.loadRatingsFromServer();
    setInterval(this.loadRatingsFromServer, this.props.pollInterval);
  },
  render: function() {
    return (
      <div className="ratingBox">
        <h1>My Beer Ratings</h1>
        <RatingList data={this.state.data} />
        <RatingForm onRatingSubmit={this.handleRatingSubmit} />
      </div>
    );
  }
});

var RatingList = React.createClass({
  render: function() {
    var ratingNodes = this.props.data.map(function(rating) {
      return (
        <Rating key={rating.id}
                postDate={rating.postDate}
                image={rating.image}
                brand={rating.brand}
                name={rating.name}
                author={rating.author}
                numStars={rating.numStars}
                title={rating.title}
            >
          {rating.text}
        </Rating>
      );
    });
    return (
      <div className="ratingList">
        {ratingNodes}
      </div>
    );
  }
});

var RatingForm = React.createClass({
  getInitialState: function() {
    return {author: '', text: ''};
  },
  handleAuthorChange: function(e) {
    this.setState({author: e.target.value});
  },
  handleTextChange: function(e) {
    this.setState({text: e.target.value});
  },
  handleSubmit: function(e) {
    e.preventDefault();
    var author = this.state.author.trim();
    var text = this.state.text.trim();
    if (!text || !author) {
      return;
    }
    this.props.onRatingSubmit({author: author, text: text});
    this.setState({author: '', text: ''});
  },
  render: function() {
    return (
      <form className="ratingForm" onSubmit={this.handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={this.state.author}
          onChange={this.handleAuthorChange}
        />
        <input
          type="text"
          placeholder="Say something..."
          value={this.state.text}
          onChange={this.handleTextChange}
        />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

ReactDOM.render(
  <RatingBox url="/api/ratings" pollInterval={2000} />,
  document.getElementById('content')
);
