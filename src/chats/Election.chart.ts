import { IElection, IVote } from '@prism/sql/gameSchema/Election.schema';

export function getElectionChart(elections: IElection[], votes: IVote[]): string {
    const width = 800;
    const height = 500;
    const backgroundColor = '#17171c';

    votes = votes.filter((vote) => vote.vote_count > 0);

    const sendApiData = {
        type: 'doughnut',
        data: {
            labels: votes.map((vote) => `${vote.name} [${vote.vote_count}]`),
            datasets: [
                {
                    data: votes.map((vote) => vote.vote_count),
                    backgroundColor: [
                        '#118f50',
                        '#e5a500',
                        '#af1310',
                        '#e74206',
                        '#7ccc04',
                        '#04a0cb',
                        '#3619f7',
                        '#c70af7',
                        '#ec054c',
                        '#1ad778',
                        '#ffd158',
                        '#ec3633',
                        '#fb9068',
                        '#fcdf3c',
                        '#affc3c',
                        '#3cd2fb',
                        '#a89cfc',
                        '#e387fb',
                        '#fc6e9a',
                    ],
                    borderColor: '#17171c',
                    fontColor: '#efeff1',
                    borderWidth: 5,
                    fill: false,
                    spanGaps: false,
                    lineTension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 3,
                    pointStyle: 'circle',
                    borderDash: [0, 0],
                    barPercentage: 0.9,
                    categoryPercentage: 0.8,
                },
            ],
        },
        options: {
            title: {
                display: true,
                position: 'top',
                fontSize: 20,
                fontColor: '#efeff1',
                fontStyle: 'bold',
                padding: 10,
                lineHeight: 1.2,
                text: elections[0].name.toUpperCase(),
                fontFamily: 'sans-serif',
            },

            layout: {
                padding: 30,
                backgroundColor: '#000',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            },
            legend: {
                display: true,
                position: 'right',
                align: 'center',
                fullWidth: true,
                reverse: false,
                labels: {
                    fontSize: 16,
                    fontFamily: 'sans-serif',
                    fontColor: '#efeff1',
                    fontStyle: 'normal',
                    padding: 10,
                },
            },
            plugins: {
                datalabels: {
                    display: true,
                    align: 'center',
                    anchor: 'center',
                    backgroundColor: '#17171c',
                    borderColor: '#17171c',
                    borderRadius: 4,
                    borderWidth: 0,
                    padding: 4,
                    color: '#efeff1',
                    font: {
                        family: 'sans-serif',
                        size: 20,
                        style: 'bold',
                    },
                },
            },
        },
    };
    return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(sendApiData))}&bkg=${encodeURIComponent(backgroundColor)}&w=${width}&h=${height}`;
}
