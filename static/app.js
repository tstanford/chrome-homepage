'use strict';

function SearchBox(props) {
    return (
        <input id="query" placeholder="search" autoFocus onChange={props.onChange}></input>
    );
}

class App extends React.Component{

    constructor(props){
        super(props);
        this.state = {
            items :[],
            isLoaded: false,
        }
        this.searchOnChange = this.searchOnChange.bind(this);
    }

    componentDidMount(){
        fetch('/json')
        .then(res => res.json())
        .then(json => {
            this.setState({
                isLoaded: true,
                items: json,
                query: ""
            })
        });
    }

    searchOnChange(event) {
        this.setState({query: event.target.value});
      }

    render(){
        var {isLoaded, items, query} = this.state;
        var filteredFolders = items.filter(i => query == "" || i.name.startsWith(query));
        if (filteredFolders.length ==0 ) filteredFolders = items
        if(!isLoaded){
            return (
                <div class="lds-hourglass"></div>
            );
        }
        else {
            return (
            <div id="app">
                <SearchBox onChange={this.searchOnChange}/>
                <article id="folders">
                    {filteredFolders.filter(
                            f => query == "" || 
                            f.bookmarks.filter(b => b.name.toLowerCase().includes(query.toLowerCase())).length > 0
                        ).map(folder => (
                        <div class="folder">
                            <label>{folder.name}</label>
                            {folder.bookmarks.filter(
                                    b => query == "" || 
                                    b.name.toLowerCase().includes(query.toLowerCase())
                                ).map(bookmark => (
                                <a href={bookmark.url} target="_blank"><img src={bookmark.favicon}/>{bookmark.name}</a>
                            ))}
                        </div>
                    ))}
                </article>
            </div>
            );
        }
    }
}

ReactDOM.render(
    <App/>,
    document.querySelector('App')
);